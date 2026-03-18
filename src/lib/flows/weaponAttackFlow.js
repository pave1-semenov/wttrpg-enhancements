import { getAttachedWeaponSkillsSync, isWeaponSkill } from '../util/weaponSkillAttachment.js';
import { ATTACK_MODES, TEMPLATE_PATHS } from '../util/constants.js';
import {
    getWeaponSkillEffectiveAttackSkill,
    getWeaponSkillParentWeapon,
    withWeaponSkillNativeAttackOverride
} from '../util/weaponSkill.js';

const { DialogV2 } = foundry.applications.api;

function formatBoolean(value) {
    return game.i18n.localize(value ? 'WTTRPGEnhancements.WeaponSkillAttack.Yes' : 'WTTRPGEnhancements.WeaponSkillAttack.No');
}

function formatDamageTypes(skill) {
    if (skill.system?.type?.text) return skill.system.type.text;

    const selectedTypes = Array.isArray(skill.system?.damageType)
        ? skill.system.damageType
        : Array.from(skill.system?.damageType ?? []);
    const labels = selectedTypes
        .map(type => CONFIG.WITCHER?.damageTypes?.find(option => option.value === type)?.label)
        .filter(Boolean)
        .map(label => game.i18n.localize(label));

    return labels.join(', ') || '-';
}

function formatDefenseOptions(skill) {
    const options = Array.isArray(skill.system?.defenseOptions)
        ? skill.system.defenseOptions
        : Array.from(skill.system?.defenseOptions ?? []);

    const labels = options
        .map(option => CONFIG.WITCHER?.defenseOptions?.find(entry => entry.value === option)?.label)
        .filter(Boolean)
        .map(label => game.i18n.localize(label));

    return labels.join(', ') || '-';
}

function formatAttackMode(skill) {
    const attackMode = Array.from(skill.system?.attackOptions ?? [])[0] ?? ATTACK_MODES.MELEE;
    return game.i18n.localize(`WITCHER.Attack.attackOptions.${attackMode}`);
}

function formatAttackSkill(skill) {
    const skillName = getWeaponSkillEffectiveAttackSkill(skill.system);
    return CONFIG.WITCHER?.skillMap?.[skillName]?.label
        ? game.i18n.localize(CONFIG.WITCHER.skillMap[skillName].label)
        : skillName || '-';
}

function buildSkillStats(skill) {
    const attackMode = Array.from(skill.system?.attackOptions ?? [])[0] ?? ATTACK_MODES.MELEE;

    const stats = [
        {
            label: game.i18n.localize('WTTRPGEnhancements.WeaponSkill.DamageFormula'),
            value: skill.system?.damage || '-'
        },
        {
            label: game.i18n.localize('WITCHER.Dialog.damageType'),
            value: formatDamageTypes(skill)
        },
        {
            label: game.i18n.localize('WITCHER.Attack.attackOptions.label'),
            value: formatAttackMode(skill)
        },
        {
            label: game.i18n.localize('WTTRPGEnhancements.WeaponSkill.AttackSkillOverrideLabel'),
            value: formatAttackSkill(skill)
        },
        {
            label: game.i18n.localize('WITCHER.Weapon.Range'),
            value: skill.system?.range || '-'
        }
    ];

    if (attackMode === ATTACK_MODES.MELEE) {
        stats.push({
            label: game.i18n.localize('WITCHER.Weapon.MeleeBonus'),
            value: formatBoolean(!!skill.system?.applyMeleeBonus)
        });
    } else {
        stats.push(
            {
                label: game.i18n.localize('WITCHER.Weapon.Short.WeaponAccuracy'),
                value: `${skill.system?.accuracy ?? 0}`
            },
            {
                label: game.i18n.localize('WITCHER.Weapon.useAmmo'),
                value: formatBoolean(!!skill.system?.usingAmmo)
            }
        );
    }

    stats.push(
        {
            label: game.i18n.localize('WITCHER.Weapon.onlyDmg'),
            value: formatBoolean(!!skill.system?.rollOnlyDmg)
        },
        {
            label: game.i18n.localize('WITCHER.Item.Settings.attacks.defendWith.label'),
            value: formatDefenseOptions(skill)
        }
    );

    return stats;
}

async function showWeaponSkillInfoDialog(skillUuid) {
    const skill = await fromUuid(skillUuid);
    if (!skill) return;

    const description = skill.system?.description
        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(skill.system.description)
        : `<p>${game.i18n.localize('WTTRPGEnhancements.WeaponSkillAttack.NoDescription')}</p>`;

    const content = await foundry.applications.handlebars.renderTemplate(
        TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_INFO,
        {
            name: skill.name,
            img: skill.img,
            parentWeapon: getWeaponSkillParentWeapon(skill.system, skill)?.name ?? '',
            description,
            stats: buildSkillStats(skill)
        }
    );

    await new DialogV2({
        classes: ['weapon-skill-info-modal'],
        window: {
            title: game.i18n.format('WTTRPGEnhancements.WeaponSkillAttack.InfoTitle', {
                skill: skill.name
            }),
            resizable: true
        },
        modal: true,
        position: {
            width: 880,
            height: 760
        },
        content,
        buttons: [
            {
                action: 'close',
                label: game.i18n.localize('WTTRPGEnhancements.WeaponSkillAttack.CloseInfo')
            }
        ]
    }).render({ force: true });
}

export async function wrapWeaponAttack(wrapped, weapon, options = {}) {
    if (!weapon || isWeaponSkill(weapon) || options.skipWeaponSkillChooser) {
        return wrapped(weapon, options);
    }

    const attachedSkills = getAttachedWeaponSkillsSync(weapon);
    if (!attachedSkills.length) {
        return wrapped(weapon, options);
    }

    const choice = await promptWeaponSkillChoice(weapon, attachedSkills);
    if (!choice || choice.mode === 'standard') {
        return wrapped(weapon, options);
    }

    const chosenSkill = attachedSkills.find(skill => skill.id === choice.skillId);

    return withWeaponSkillNativeAttackOverride(chosenSkill ?? weapon, activeWeapon => {
        return wrapped(activeWeapon, {
            ...options,
            skipWeaponSkillChooser: true
        });
    });
}

async function promptWeaponSkillChoice(weapon, attachedSkills) {
    const content = await foundry.applications.handlebars.renderTemplate(
        TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_ATTACK_CHOICE,
        {
            attachedSkills: attachedSkills.map((skill, index) => ({
                id: skill.id,
                uuid: skill.uuid,
                name: skill.name,
                img: skill.img,
                checked: index === 0
            }))
        }
    );

    return DialogV2.wait({
        window: {
            title: game.i18n.format('WTTRPGEnhancements.WeaponSkillAttack.ChooseTitle', {
                weapon: weapon.name
            }),
            resizable: true
        },
        position: {
            width: 920,
            height: 'auto'
        },
        content,
        render: (_event, dialog) => {
            dialog.element.querySelectorAll('.weapon-skills-card__info').forEach(button => {
                if (button.dataset.boundInfo === 'true') return;
                button.dataset.boundInfo = 'true';
                button.addEventListener('click', async event => {
                    event.preventDefault();
                    event.stopPropagation();
                    await showWeaponSkillInfoDialog(button.dataset.skillUuid);
                });
            });
        },
        buttons: [
            {
                action: 'useSkill',
                label: game.i18n.localize('WTTRPGEnhancements.WeaponSkillAttack.UseSkill'),
                default: true,
                callback: (event, button) => ({
                    mode: 'skill',
                    skillId: button.form.elements.selectedSkill.value
                })
            },
            {
                action: 'standard',
                label: game.i18n.localize('WTTRPGEnhancements.WeaponSkillAttack.StandardAttack'),
                callback: () => ({
                    mode: 'standard'
                })
            }
        ],
        rejectClose: false
    });
}
