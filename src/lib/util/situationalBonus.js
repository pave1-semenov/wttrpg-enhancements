import { evaluateCondition } from './condition.js';
import { ITEM_TYPES, TEMPLATE_PATHS } from './constants.js';

export function getSituationalBonuses(actor, scope, context = {}) {
    if (!actor) return [];
    const target = context.target ?? Array.from(game.user?.targets ?? [])[0]?.actor ?? null;
    return Array.from(actor.items ?? []).filter(item => {
        if (item.type !== ITEM_TYPES.SITUATIONAL_BONUS || item.system?.scope !== scope) return false;
        const parentItemUuid = item.system?.parentItemUuid ?? '';
        if (parentItemUuid && !matchesSource(context.source, parentItemUuid)) return false;
        const skillFilters = item.system?.applicableSkills ?? [];
        if (scope === 'skill' && skillFilters.length && !matchesSkill(context.source, skillFilters)) return false;
        return evaluateCondition(item.system?.condition ?? '', {
            attacker: actor,
            target,
            source: context.source,
            damage: context.damage
        });
    });
}

function matchesSource(source, parentItemUuid) {
    if (!source) return false;
    return source.uuid === parentItemUuid || source.system?.parentWeaponUuid === parentItemUuid;
}

function matchesSkill(source, filters) {
    if (!source) return false;
    const identities = new Set([
        source.name,
        source.id,
        source.uuid,
        source.situationalBonusIdentity,
        source.skillName ? `profession:${source.skillName}` : null
    ].filter(Boolean));
    return filters.some(filter => identities.has(filter));
}

export async function prepareSituationalBonusCards(actor, scopes, context = {}) {
    const bonuses = scopes.flatMap(scope => getSituationalBonuses(actor, scope, context));
    const cards = await Promise.all(bonuses.map(async bonus => {
        const parent = resolveParentItem(bonus.system.parentItemUuid);
        return {
            id: bonus.id,
            name: bonus.name,
            img: bonus.img,
            formula: bonus.system.formula,
            imageLayout: ['left', 'right', 'cover'].includes(bonus.system.imageLayout)
                ? bonus.system.imageLayout
                : 'left',
            scope: bonus.system.scope,
            scopeLabel: game.i18n.localize(`WTTRPGEnhancements.SituationalBonus.Scope.${bonus.system.scope}`),
            origin: parent ? 'item' : 'actor',
            originLabel: parent?.name ?? game.i18n.localize('WTTRPGEnhancements.SituationalBonus.GlobalActor'),
            description: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                bonus.system.description ?? '', { documents: false }
            )
        };
    }));
    return cards;
}

function resolveParentItem(uuid) {
    if (!uuid || typeof fromUuidSync !== 'function') return null;
    try { return fromUuidSync(uuid); } catch { return null; }
}

export async function renderSituationalBonusCards(actor, scopes, context = {}) {
    const bonuses = await prepareSituationalBonusCards(actor, scopes, context);
    if (!bonuses.length) return '';
    return foundry.applications.handlebars.renderTemplate(TEMPLATE_PATHS.DIALOG_SITUATIONAL_BONUSES, { bonuses });
}

export function selectedBonusFormula(root, scope) {
    const formulas = Array.from(root?.querySelectorAll(
        `input[data-situational-bonus][data-scope="${scope}"]:checked`
    ) ?? []).map(input => input.dataset.formula).filter(Boolean);
    return formulas.map(formula => `+(${formula})`).join('');
}

export function appendFormula(value, formula) {
    return formula ? `${value || 0}${formula}` : value;
}
