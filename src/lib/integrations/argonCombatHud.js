import { ITEM_TYPES, MODULE, SETTINGS, WEAPON_SKILL_ATTACK_OPTIONS } from '../util/constants.js';
import { getAttachedWeaponSkillsSync, isWeaponSkill } from '../util/weaponSkillAttachment.js';
import { getCurrentTargetActor, isWeaponSkillAvailable } from '../util/weaponSkillAvailability.js';

const ARGON_CORE_MODULE_ID = 'enhancedcombathud';
const ARGON_WITCHER_MODULE_ID = 'enhancedcombathud-TheWitcherTRPG';
const ARGON_ITEM_BUTTON_RENDER_HOOK = 'renderItemButtonArgonComponent';
const ARGON_COMPONENT_VISIBILITY_SETTINGS = [
    {
        hook: 'renderWitcherBrawlingPanelButtonArgonComponent',
        setting: SETTINGS.ARGON_SHOW_BRAWLING_ACTIONS
    },
    {
        hook: 'renderWitcherVerbalCombatButtonArgonComponent',
        setting: SETTINGS.ARGON_SHOW_VERBAL_COMBAT
    },
    {
        hook: 'renderWitcherSpecialAttacksPanelButtonArgonComponent',
        setting: SETTINGS.ARGON_SHOW_SPECIAL_ATTACKS
    }
];

let hooksRegistered = false;
let fallbackWeaponButtonClass = null;

function isArgonWitcherActive() {
    return game.modules.get(ARGON_CORE_MODULE_ID)?.active
        && game.modules.get(ARGON_WITCHER_MODULE_ID)?.active;
}

function stopWeaponButtonEvent(event) {
    event.stopPropagation();
}

function applyComponentVisibility(setting, element) {
    if (!isArgonWitcherActive()) return;
    element.classList.toggle('hidden', !game.settings.get(MODULE.ID, setting));
}

function getFallbackWeaponButtonClass() {
    const ItemButton = CONFIG.ARGON?.MAIN?.BUTTONS?.ItemButton;
    if (!ItemButton) return null;
    if (fallbackWeaponButtonClass && Object.getPrototypeOf(fallbackWeaponButtonClass) === ItemButton) {
        return fallbackWeaponButtonClass;
    }

    fallbackWeaponButtonClass = class WitcherFallbackWeaponButton extends ItemButton {
        get label() {
            return this.item.name;
        }

        get icon() {
            return this.item.img;
        }

        get targets() {
            return 1;
        }

        async _onLeftClick() {
            await this.actor.weaponAttack(this.item);
        }

        async _onRightClick() {
            this.item.sheet.render(true);
        }
    };

    return fallbackWeaponButtonClass;
}

function ensureWeaponButtons(panel, element) {
    if (!isArgonWitcherActive()) return;
    if (panel.actor?.type !== 'monster') return;
    if (panel.buttons.some(button => button.item?.type === ITEM_TYPES.WEAPON)) return;

    const weapons = Array.from(panel.actor?.getList?.(ITEM_TYPES.WEAPON) ?? [])
        .filter(weapon => !weapon.system?.isAmmo);
    if (!weapons.length) return;

    const WeaponButton = getFallbackWeaponButtonClass();
    if (!WeaponButton) return;

    const buttons = weapons.map(weapon => new WeaponButton({ item: weapon }));
    for (const button of buttons) button._parent = panel;

    panel._buttons.unshift(...buttons);
    element.prepend(...buttons.map(button => button.element));
    for (const button of buttons) void button.render();
    panel.updateVisibility();
}

function createSkillButton(skill, weapon) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('wttrpg-enhancements-argon-skill');
    button.dataset.skillId = skill.id;
    button.dataset.tooltip = skill.name;
    button.dataset.tooltipDirection = 'UP';
    button.setAttribute('aria-label', skill.name);

    const icon = document.createElement('img');
    icon.src = skill.img;
    icon.alt = '';
    button.append(icon);

    for (const eventName of ['pointerdown', 'mousedown', 'mouseup']) {
        button.addEventListener(eventName, stopWeaponButtonEvent);
    }

    button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;

        button.disabled = true;
        try {
            await weapon.actor?.weaponAttack(weapon, {
                [WEAPON_SKILL_ATTACK_OPTIONS.DIRECT_SKILL_ID]: skill.id
            });
        } finally {
            button.disabled = false;
        }
    });

    button.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        skill.sheet.render(true);
    });

    return button;
}

function addWeaponSkillIcons(itemButton, element) {
    element.querySelector('.wttrpg-enhancements-argon-skills')?.remove();
    element.classList.remove('wttrpg-enhancements-argon-weapon');

    if (!isArgonWitcherActive()) return;

    const weapon = itemButton?.item;
    if (weapon?.type !== ITEM_TYPES.WEAPON || !weapon.actor) return;

    const target = getCurrentTargetActor();
    const skills = getAttachedWeaponSkillsSync(weapon)
        .filter(skill => isWeaponSkillAvailable(skill, weapon.actor, target));
    if (!skills.length) return;

    const overlay = document.createElement('div');
    overlay.classList.add('wttrpg-enhancements-argon-skills');

    const bottomRail = document.createElement('div');
    bottomRail.classList.add(
        'wttrpg-enhancements-argon-skills__rail',
        'wttrpg-enhancements-argon-skills__rail--bottom'
    );
    bottomRail.append(...skills.slice(0, 3).map(skill => createSkillButton(skill, weapon)));
    overlay.append(bottomRail);

    const upperSkills = skills.slice(3);
    if (upperSkills.length) {
        const topRail = document.createElement('div');
        topRail.classList.add(
            'wttrpg-enhancements-argon-skills__rail',
            'wttrpg-enhancements-argon-skills__rail--top'
        );
        topRail.append(...upperSkills.map(skill => createSkillButton(skill, weapon)));
        overlay.append(topRail);
    }
    element.classList.add('wttrpg-enhancements-argon-weapon');
    element.append(overlay);
}

function refreshWeaponButtons(item) {
    if (!isArgonWitcherActive() || !isWeaponSkill(item)) return;
    if (item.parent !== ui.ARGON?._actor) return;

    refreshArgonWeaponButtons(item.parent);
}

function refreshArgonWeaponButtons(actor) {
    if (!actor) return;

    for (const itemButton of ui.ARGON.itemButtons ?? []) {
        const weapon = itemButton?.item;
        if (weapon?.type === ITEM_TYPES.WEAPON && weapon.actor === actor) {
            void itemButton.render();
        }
    }
}

function refreshWeaponButtonsForTarget(user) {
    if (user !== game.user || !isArgonWitcherActive()) return;
    refreshArgonWeaponButtons(ui.ARGON?._actor);
}

export function registerArgonCombatHudIntegration() {
    if (hooksRegistered) return;
    hooksRegistered = true;

    Hooks.on(ARGON_ITEM_BUTTON_RENDER_HOOK, addWeaponSkillIcons);
    Hooks.on('renderWitcherMainActionPanelArgonComponent', ensureWeaponButtons);
    for (const { hook, setting } of ARGON_COMPONENT_VISIBILITY_SETTINGS) {
        Hooks.on(hook, (_component, element) => applyComponentVisibility(setting, element));
    }
    Hooks.on('createItem', refreshWeaponButtons);
    Hooks.on('updateItem', refreshWeaponButtons);
    Hooks.on('deleteItem', refreshWeaponButtons);
    Hooks.on('targetToken', refreshWeaponButtonsForTarget);
}
