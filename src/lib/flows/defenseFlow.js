import { isWeaponSkill } from '../util/weaponSkillAttachment.js';

const { DialogV2 } = foundry.applications.api;

function getAdditionalDefenseSkills(skill) {
    const values = Array.isArray(skill?.system?.additionalDefenseSkills)
        ? skill.system.additionalDefenseSkills
        : Array.from(skill?.system?.additionalDefenseSkills ?? []);

    return Array.from(new Set(values.filter(Boolean)));
}

function buildAdditionalDefenseButtons(skill) {
    return getAdditionalDefenseSkills(skill)
        .map(skillName => CONFIG.WITCHER?.skillMap?.[skillName])
        .filter(Boolean)
        .map(skillMapEntry => ({
            action: `weapon-skill-defense-${skillMapEntry.name}`,
            label: game.i18n.localize(skillMapEntry.label),
            callback: (_event, button) => ({
                defenseAction: {
                    label: game.i18n.localize(skillMapEntry.label),
                    value: skillMapEntry.name,
                    skills: [skillMapEntry.name],
                    modifier: 0,
                    stagger: false,
                    block: false
                },
                extraDefense: button.form.elements.isExtraDefense.checked,
                customDef: button.form.elements.customDef.value
            })
        }));
}

export async function wrapPrepareAndExecuteDefense(wrapped, attack, defenseOptions, attackDamageObject, totalAttack, attacker) {
    const attackItem = attackDamageObject?.itemUuid ? await fromUuid(attackDamageObject.itemUuid) : null;
    if (!isWeaponSkill(attackItem)) {
        return wrapped(attack, defenseOptions, attackDamageObject, totalAttack, attacker);
    }

    const additionalButtons = buildAdditionalDefenseButtons(attackItem);
    if (!additionalButtons.length) {
        return wrapped(attack, defenseOptions, attackDamageObject, totalAttack, attacker);
    }

    const originalWait = DialogV2.wait.bind(DialogV2);
    DialogV2.wait = function patchedWait(config = {}) {
        const isDefenseDialog = config.window?.title === game.i18n.localize('WITCHER.Dialog.DefenseTitle');
        if (!isDefenseDialog || !Array.isArray(config.buttons)) {
            return originalWait(config);
        }

        return originalWait({
            ...config,
            buttons: [...config.buttons, ...additionalButtons]
        });
    };

    try {
        return await wrapped(attack, defenseOptions, attackDamageObject, totalAttack, attacker);
    } finally {
        DialogV2.wait = originalWait;
    }
}
