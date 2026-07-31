const MAX_VISIBLE_COMPLETIONS = 10;
const DEFAULT_SCOPE = 'full';
const WEAPON_SKILL_SCOPE = 'weapon-skill';
const ALL_SCOPES = [DEFAULT_SCOPE, WEAPON_SKILL_SCOPE];
let autocompleteId = 0;

function createCompletion(template, detail, {
    scopes = ALL_SCOPES,
    priority = 50,
    keywords = []
} = {}) {
    const markerIndex = template.indexOf('|');
    const insertText = markerIndex === -1
        ? template
        : `${template.slice(0, markerIndex)}${template.slice(markerIndex + 1)}`;

    return {
        label: insertText,
        insertText,
        cursorOffset: markerIndex === -1 ? 0 : markerIndex - insertText.length,
        detail,
        scopes,
        priority,
        keywords
    };
}

const ROOT_COMPLETIONS = [
    createCompletion('actor', 'WTTRPGEnhancements.ConditionAutocomplete.Actor', { priority: 0 }),
    createCompletion('target', 'WTTRPGEnhancements.ConditionAutocomplete.Target', { priority: 0 }),
    createCompletion('attacker', 'WTTRPGEnhancements.ConditionAutocomplete.Attacker', {
        scopes: [DEFAULT_SCOPE],
        priority: 0
    }),
    createCompletion('damage', 'WTTRPGEnhancements.ConditionAutocomplete.Damage', {
        scopes: [DEFAULT_SCOPE],
        priority: 0
    }),
    createCompletion('source', 'WTTRPGEnhancements.ConditionAutocomplete.Source', {
        scopes: [DEFAULT_SCOPE],
        priority: 0
    }),
    createCompletion('professionTree', 'WTTRPGEnhancements.ConditionAutocomplete.ProfessionTree', {
        scopes: [DEFAULT_SCOPE],
        priority: 0
    })
];

const RESOURCE_COMPLETIONS = [
    ['hp', 'derivedStats.hp.value', false],
    ['maxHp', 'derivedStats.hp.max', true],
    ['sta', 'derivedStats.sta.value', false],
    ['maxSta', 'derivedStats.sta.max', true],
    ['shield', 'derivedStats.shield.value', false],
    ['maxShield', 'derivedStats.shield.max', true],
    ['focus', 'derivedStats.focus.value', false],
    ['maxFocus', 'derivedStats.focus.max', true],
    ['resolve', 'derivedStats.resolve.value', false],
    ['maxResolve', 'derivedStats.resolve.max', true],
    ['vigor', 'derivedStats.vigor.value', false],
    ['maxVigor', 'derivedStats.vigor.max', true],
    ['luck', 'stats.luck.value', false],
    ['maxLuck', 'stats.luck.max', true],
    ['toxicity', 'stats.toxicity.value', false],
    ['maxToxicity', 'stats.toxicity.max', true]
].flatMap(([helper, path, isMaximum]) => {
    const detail = isMaximum
        ? 'WTTRPGEnhancements.ConditionAutocomplete.MaximumResource'
        : 'WTTRPGEnhancements.ConditionAutocomplete.Resource';

    return [
        createCompletion(`${helper}(|)`, detail, {
            priority: 10,
            keywords: [path]
        }),
        ...['actor', 'target'].map(root => createCompletion(
            `${root}.system.${path}`,
            detail,
            {
                priority: 20,
                keywords: [helper, root]
            }
        ))
    ];
});

const HELPER_COMPLETIONS = [
    createCompletion("attribute('|')", 'WTTRPGEnhancements.ConditionAutocomplete.Attribute', { priority: 30 }),
    createCompletion("maxAttribute('|')", 'WTTRPGEnhancements.ConditionAutocomplete.MaximumAttribute', { priority: 30 }),
    createCompletion("stat('|')", 'WTTRPGEnhancements.ConditionAutocomplete.Stat', { priority: 30 }),
    createCompletion("hasActiveEffect('|')", 'WTTRPGEnhancements.ConditionAutocomplete.ActiveEffect', { priority: 30 }),
    createCompletion("hasActiveEffect('|', target)", 'WTTRPGEnhancements.ConditionAutocomplete.TargetActiveEffect', { priority: 30 }),
    createCompletion("getActiveEffect('|')", 'WTTRPGEnhancements.ConditionAutocomplete.GetActiveEffect', { priority: 30 }),
    createCompletion("armor('|', target)", 'WTTRPGEnhancements.ConditionAutocomplete.TargetArmor', { priority: 30 }),
    createCompletion("armor('|', actor)", 'WTTRPGEnhancements.ConditionAutocomplete.ActorArmor', { priority: 30 }),
    createCompletion("professionSkill('|')", 'WTTRPGEnhancements.ConditionAutocomplete.ProfessionSkill', { priority: 30 }),
    createCompletion("professionSkillRank('|')", 'WTTRPGEnhancements.ConditionAutocomplete.ProfessionSkillRank', { priority: 30 }),
    createCompletion('professionSkillPoints()', 'WTTRPGEnhancements.ConditionAutocomplete.ProfessionSkillPoints', { priority: 30 }),
    createCompletion("hasProfessionSkill('|', 1)", 'WTTRPGEnhancements.ConditionAutocomplete.HasProfessionSkill', { priority: 30 }),
    createCompletion('professionTree(actor)', 'WTTRPGEnhancements.ConditionAutocomplete.ProfessionTreeHelper', { priority: 30 }),
    createCompletion("isSourceAWeaponSkill('|')", 'WTTRPGEnhancements.ConditionAutocomplete.SourceWeaponSkill', {
        scopes: [DEFAULT_SCOPE],
        priority: 30
    }),
    createCompletion("isSourceAWeapon('|')", 'WTTRPGEnhancements.ConditionAutocomplete.SourceWeapon', {
        scopes: [DEFAULT_SCOPE],
        priority: 30
    })
];

const PROPERTY_COMPLETIONS = ['actor', 'target'].flatMap(root => [
    createCompletion(`${root}.name`, 'WTTRPGEnhancements.ConditionAutocomplete.DocumentName', { priority: 20 }),
    createCompletion(`${root}.type`, 'WTTRPGEnhancements.ConditionAutocomplete.DocumentType', { priority: 20 })
]);

const FULL_PROPERTY_COMPLETIONS = [
    ...['amount', 'type', 'location', 'properties'].map(property => createCompletion(
        `damage.${property}`,
        'WTTRPGEnhancements.ConditionAutocomplete.Damage',
        { scopes: [DEFAULT_SCOPE], priority: 20 }
    )),
    ...['name', 'type'].map(property => createCompletion(
        `source.${property}`,
        'WTTRPGEnhancements.ConditionAutocomplete.Source',
        { scopes: [DEFAULT_SCOPE], priority: 20 }
    ))
];

const LITERAL_COMPLETIONS = [
    createCompletion('true', 'WTTRPGEnhancements.ConditionAutocomplete.Boolean', { priority: 40 }),
    createCompletion('false', 'WTTRPGEnhancements.ConditionAutocomplete.Boolean', { priority: 40 }),
    createCompletion('null', 'WTTRPGEnhancements.ConditionAutocomplete.Null', { priority: 40 }),
    createCompletion('undefined', 'WTTRPGEnhancements.ConditionAutocomplete.Undefined', { priority: 40 })
];

const COMPLETIONS = [
    ...ROOT_COMPLETIONS,
    ...RESOURCE_COMPLETIONS,
    ...HELPER_COMPLETIONS,
    ...PROPERTY_COMPLETIONS,
    ...FULL_PROPERTY_COMPLETIONS,
    ...LITERAL_COMPLETIONS
];

function isInsideString(value) {
    let quote = null;
    let escaped = false;

    for (const character of value) {
        if (escaped) {
            escaped = false;
            continue;
        }
        if (character === '\\') {
            escaped = true;
            continue;
        }
        if (quote) {
            if (character === quote) quote = null;
        } else if (character === "'" || character === '"') {
            quote = character;
        }
    }

    return quote !== null;
}

function getCompletionFragment(value, cursor) {
    const beforeCursor = value.slice(0, cursor);
    if (isInsideString(beforeCursor)) return null;

    const match = beforeCursor.match(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.?$/);
    return {
        text: match?.[0] ?? '',
        start: match ? cursor - match[0].length : cursor,
        end: cursor
    };
}

function getMatchScore(completion, query) {
    const value = completion.insertText.toLocaleLowerCase();
    const label = completion.label.toLocaleLowerCase();
    const keywords = completion.keywords.map(keyword => keyword.toLocaleLowerCase());

    if (value === query || label === query) return 0;
    if (value.startsWith(query) || label.startsWith(query)) return 1;

    const segments = value.split(/[^a-z0-9_$]+/).filter(Boolean);
    if (segments.some(segment => segment.startsWith(query))) return 2;
    if (keywords.some(keyword => keyword.includes(query))) return 3;
    if (value.includes(query) || label.includes(query)) return 4;
    return null;
}

export function getConditionCompletions(value, cursor, scope = DEFAULT_SCOPE) {
    const fragment = getCompletionFragment(value, cursor);
    if (!fragment || !fragment.text) {
        return {
            start: cursor,
            end: cursor,
            items: []
        };
    }

    const query = fragment.text.toLocaleLowerCase();
    const items = COMPLETIONS
        .filter(completion => completion.scopes.includes(scope))
        .map(completion => ({
            completion,
            score: getMatchScore(completion, query)
        }))
        .filter(entry => entry.score !== null)
        .sort((left, right) => {
            return left.score - right.score
                || left.completion.priority - right.completion.priority
                || left.completion.label.localeCompare(right.completion.label);
        })
        .slice(0, MAX_VISIBLE_COMPLETIONS)
        .map(entry => entry.completion);

    return {
        ...fragment,
        items
    };
}

export function insertConditionCompletion(value, start, end, completion) {
    const completedValue = `${value.slice(0, start)}${completion.insertText}${value.slice(end)}`;
    const cursor = start + completion.insertText.length + completion.cursorOffset;
    return {
        value: completedValue,
        cursor
    };
}

function localize(key) {
    return globalThis.game?.i18n?.localize(key) ?? key;
}

function positionMenu(input, menu) {
    const rect = input.getBoundingClientRect();
    const viewportPadding = 6;
    const desiredWidth = Math.max(rect.width, 360);
    const width = Math.min(desiredWidth, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - width - viewportPadding
    );

    menu.style.left = `${left}px`;
    menu.style.width = `${width}px`;
    menu.style.top = `${rect.bottom + 3}px`;

    const menuHeight = menu.offsetHeight;
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    if (menuHeight > availableBelow && rect.top > availableBelow) {
        menu.style.top = `${Math.max(viewportPadding, rect.top - menuHeight - 3)}px`;
    }
}

function setupConditionAutocomplete(input) {
    if (input.dataset.conditionAutocompleteBound === 'true') return;
    input.dataset.conditionAutocompleteBound = 'true';
    input.autocomplete = 'off';
    input.classList.add('condition-autocomplete__input');

    const id = `condition-autocomplete-${++autocompleteId}`;
    const menu = document.createElement('div');
    menu.id = id;
    menu.className = 'condition-autocomplete__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    document.body.appendChild(menu);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', id);
    input.setAttribute('aria-expanded', 'false');

    let completionState = null;
    let activeIndex = 0;
    let blurTimer = null;
    let positionListenersActive = false;

    const onViewportChange = () => {
        if (!menu.hidden) positionMenu(input, menu);
    };

    const setPositionListeners = enabled => {
        if (enabled === positionListenersActive) return;
        positionListenersActive = enabled;
        window[enabled ? 'addEventListener' : 'removeEventListener']('resize', onViewportChange);
        document[enabled ? 'addEventListener' : 'removeEventListener']('scroll', onViewportChange, true);
    };

    const closeMenu = () => {
        menu.hidden = true;
        menu.replaceChildren();
        completionState = null;
        activeIndex = 0;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        setPositionListeners(false);
    };

    const setActiveIndex = index => {
        if (!completionState?.items.length) return;
        activeIndex = (index + completionState.items.length) % completionState.items.length;
        menu.querySelectorAll('[role="option"]').forEach((option, optionIndex) => {
            const active = optionIndex === activeIndex;
            option.classList.toggle('condition-autocomplete__option--active', active);
            option.setAttribute('aria-selected', String(active));
            if (active) {
                input.setAttribute('aria-activedescendant', option.id);
                option.scrollIntoView({ block: 'nearest' });
            }
        });
    };

    const applyCompletion = index => {
        const completion = completionState?.items[index];
        if (!completion) return;

        const result = insertConditionCompletion(
            input.value,
            completionState.start,
            completionState.end,
            completion
        );
        input.value = result.value;
        input.setSelectionRange(result.cursor, result.cursor);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closeMenu();
        input.focus();
    };

    const renderMenu = () => {
        const cursor = input.selectionStart ?? input.value.length;
        completionState = getConditionCompletions(
            input.value,
            cursor,
            input.dataset.conditionContext ?? DEFAULT_SCOPE
        );
        activeIndex = 0;
        menu.replaceChildren();

        if (!completionState.items.length) {
            closeMenu();
            return;
        }

        completionState.items.forEach((completion, index) => {
            const option = document.createElement('button');
            option.id = `${id}-option-${index}`;
            option.type = 'button';
            option.className = 'condition-autocomplete__option';
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', String(index === activeIndex));

            const expression = document.createElement('code');
            expression.className = 'condition-autocomplete__expression';
            expression.textContent = completion.label;

            const detail = document.createElement('span');
            detail.className = 'condition-autocomplete__detail';
            detail.textContent = localize(completion.detail);

            option.append(expression, detail);
            option.addEventListener('pointerenter', () => setActiveIndex(index));
            option.addEventListener('pointerdown', event => event.preventDefault());
            option.addEventListener('click', () => applyCompletion(index));
            menu.appendChild(option);
        });

        const help = document.createElement('div');
        help.className = 'condition-autocomplete__help';
        help.textContent = localize('WTTRPGEnhancements.ConditionAutocomplete.KeyboardHint');
        menu.appendChild(help);

        menu.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        setPositionListeners(true);
        setActiveIndex(0);
        positionMenu(input, menu);
    };

    input.addEventListener('focus', () => {
        if (blurTimer) clearTimeout(blurTimer);
        renderMenu();
    });
    input.addEventListener('input', () => renderMenu());
    input.addEventListener('click', () => renderMenu());
    input.addEventListener('keydown', event => {
        if (menu.hidden) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(activeIndex + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(activeIndex - 1);
        } else if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            applyCompletion(activeIndex);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu();
        }
    });
    input.addEventListener('blur', () => {
        blurTimer = setTimeout(closeMenu, 100);
    });

    const observer = new MutationObserver(() => {
        if (input.isConnected) return;
        closeMenu();
        menu.remove();
        observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function bindConditionAutocomplete(root) {
    if (!root) return;

    const selector = '[data-condition-autocomplete]';
    const inputs = [
        ...(root.matches?.(selector) ? [root] : []),
        ...root.querySelectorAll(selector)
    ];
    inputs.forEach(setupConditionAutocomplete);
}
