import { WEAPON_SKILL_TYPE } from '../setup/itemTypeRegistration.js';
import { ATTACK_SKILL_OVERRIDE_MODES, DOCUMENT_TYPES, FLAG_KEYS, MODULE, TEMPLATE_PATHS, WEAPON_SKILL_DEFAULTS } from '../util/constants.js';
import { getAttachedWeaponSkills } from '../util/weaponSkillAttachment.js';

const { DialogV2 } = foundry.applications.api;

const ATTACH_MODES = {
    WEAPON: 'weapon',
    TEMPLATE: 'template'
};

export const WeaponSkillManagerMixin = Superclass =>
    class extends Superclass {
        async getAttachedSkills() {
            const skills = await getAttachedWeaponSkills(this.document);
            return skills.filter(item => item.type === WEAPON_SKILL_TYPE);
        }

        async getSkillById(skillId) {
            return (await this.getAttachedSkills()).find(item => item.id === skillId)
                ?? this.document.actor?.items?.get(skillId)
                ?? game.items.get(skillId)
                ?? (this.document.pack ? await game.packs.get(this.document.pack)?.getDocument(skillId) : null);
        }

        async promptAttachMode(skill) {
            const options = [
                {
                    value: ATTACH_MODES.WEAPON,
                    label: game.i18n.format('WTTRPGEnhancements.WeaponSkillManager.InheritWeaponProperties', {
                        weapon: this.document.name
                    })
                },
                {
                    value: ATTACH_MODES.TEMPLATE,
                    label: game.i18n.format('WTTRPGEnhancements.WeaponSkillManager.KeepTemplateProperties', {
                        skill: skill.name
                    })
                }
            ];

            const content = await foundry.applications.handlebars.renderTemplate(
                TEMPLATE_PATHS.DIALOG_WEAPON_SKILL_ATTACH_MODE,
                { options }
            );

            const values = await DialogV2.input({
                window: {
                    title: game.i18n.format('WTTRPGEnhancements.WeaponSkillManager.AttachTitle', {
                        skill: skill.name
                    })
                },
                content,
                ok: {
                    label: game.i18n.localize('WTTRPGEnhancements.WeaponSkillManager.Attach')
                }
            });

            return values?.attachMode ?? null;
        }

        getWeaponDamageTypes(weaponSystem, fallback = []) {
            const damageFlags = weaponSystem?.type ?? {};
            const types = Object.entries(damageFlags)
                .filter(([, enabled]) => !!enabled)
                .map(([type]) => type)
                .filter(type => type !== 'text');

            return types.length ? types : fallback;
        }

        toPlainArray(value, fallback = []) {
            if (value instanceof Set) return Array.from(value);
            if (Array.isArray(value)) return foundry.utils.deepClone(value);
            if (value && typeof value[Symbol.iterator] === 'function') return Array.from(value);
            return foundry.utils.deepClone(fallback);
        }

        buildInheritedSkillData(sourceData) {
            const weaponData = this.document.toObject();
            const weaponSystem = weaponData.system ?? {};

            return {
                ...sourceData.system,
                description: weaponSystem.description ?? sourceData.system?.description ?? '',
                damage: weaponSystem.damage ?? sourceData.system?.damage ?? '',
                damageType: this.getWeaponDamageTypes(weaponSystem, sourceData.system?.damageType ?? []),
                type: foundry.utils.deepClone(weaponSystem.type ?? sourceData.system?.type ?? {}),
                quantity: WEAPON_SKILL_DEFAULTS.QUANTITY,
                range: weaponSystem.range ?? sourceData.system?.range ?? '',
                accuracy: weaponSystem.accuracy ?? sourceData.system?.accuracy ?? 0,
                usingAmmo: weaponSystem.usingAmmo ?? sourceData.system?.usingAmmo ?? false,
                rollOnlyDmg: weaponSystem.rollOnlyDmg ?? sourceData.system?.rollOnlyDmg ?? false,
                isThrowable: WEAPON_SKILL_DEFAULTS.IS_THROWABLE,
                attackOptions: this.toPlainArray(weaponSystem.attackOptions, sourceData.system?.attackOptions ?? []),
                meleeAttackSkill: weaponSystem.meleeAttackSkill ?? sourceData.system?.meleeAttackSkill ?? '',
                rangedAttackSkill: weaponSystem.rangedAttackSkill ?? sourceData.system?.rangedAttackSkill ?? '',
                spellAttackSkill: weaponSystem.spellAttackSkill ?? sourceData.system?.spellAttackSkill ?? 'spellcasting',
                itemUseAttackSkill: weaponSystem.itemUseAttackSkill ?? sourceData.system?.itemUseAttackSkill ?? '',
                attackSkillOverrideMode: sourceData.system?.attackSkillOverrideMode ?? ATTACK_SKILL_OVERRIDE_MODES.NONE,
                attackSkillOverrideKey: sourceData.system?.attackSkillOverrideKey ?? '',
                applyMeleeBonus: weaponSystem.applyMeleeBonus ?? sourceData.system?.applyMeleeBonus ?? false,
                enhancementItemIds: foundry.utils.deepClone(
                    weaponSystem.enhancementItemIds ?? sourceData.system?.enhancementItemIds ?? []
                ),
                damageProperties: foundry.utils.deepClone(
                    weaponSystem.damageProperties ?? sourceData.system?.damageProperties ?? {}
                ),
                defenseOptions: this.toPlainArray(weaponSystem.defenseOptions, sourceData.system?.defenseOptions ?? []),
                defenseProperties: foundry.utils.deepClone(
                    weaponSystem.defenseProperties ?? sourceData.system?.defenseProperties ?? {}
                ),
                parentWeaponUuid: this.document.uuid
            };
        }

        buildTemplateSkillData(sourceData) {
            return {
                ...foundry.utils.deepClone(sourceData.system ?? {}),
                quantity: WEAPON_SKILL_DEFAULTS.QUANTITY,
                isThrowable: WEAPON_SKILL_DEFAULTS.IS_THROWABLE,
                attackOptions: this.toPlainArray(sourceData.system?.attackOptions, []),
                damageType: foundry.utils.deepClone(sourceData.system?.damageType ?? []),
                defenseOptions: this.toPlainArray(sourceData.system?.defenseOptions, []),
                damageProperties: foundry.utils.deepClone(sourceData.system?.damageProperties ?? {}),
                defenseProperties: foundry.utils.deepClone(sourceData.system?.defenseProperties ?? {}),
                enhancementItemIds: foundry.utils.deepClone(sourceData.system?.enhancementItemIds ?? []),
                parentWeaponUuid: this.document.uuid
            };
        }


        buildCreateFlags(sourceData, attachMode) {
            const flags = foundry.utils.deepClone(sourceData.flags ?? {});
            if (attachMode !== ATTACH_MODES.WEAPON) return flags;

            flags[MODULE.FLAGS_KEY] ??= {};
            const weaponLifesteal = foundry.utils.deepClone(this.document.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]);
            if (weaponLifesteal) {
                flags[MODULE.FLAGS_KEY][FLAG_KEYS.LIFESTEAL] = weaponLifesteal;
            } else {
                delete flags[MODULE.FLAGS_KEY][FLAG_KEYS.LIFESTEAL];
            }

            return flags;
        }
        async createAndAttachSkill(sourceData, name, forceAttachMode = null) {
            const attachMode = forceAttachMode ?? await this.promptAttachMode({ name });
            if (!attachMode) return null;

            const skillData =
                attachMode === ATTACH_MODES.WEAPON ? this.buildInheritedSkillData(sourceData) : this.buildTemplateSkillData(sourceData);
            const createData = {
                name,
                type: WEAPON_SKILL_TYPE,
                img: sourceData.img ?? this.document.img,
                system: skillData,
                effects:
                    attachMode === ATTACH_MODES.WEAPON
                        ? this.document.effects.toObject()
                        : foundry.utils.deepClone(sourceData.effects ?? []),
                flags: this.buildCreateFlags(sourceData, attachMode)
            };

            let createdSkill;
            if (this.document.actor) {
                [createdSkill] = await this.document.actor.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, [createData]);
            } else if (this.document.pack) {
                createdSkill = await Item.create(createData, { pack: this.document.pack });
            } else {
                createdSkill = await Item.create(createData);
            }

            this.render();
            return createdSkill;
        }

        async cloneAndAttachSkill(skill) {
            if (!skill || skill.type !== WEAPON_SKILL_TYPE) {
                ui.notifications.warn('Only weapon skills can be attached here.');
                return;
            }

            const sourceData = skill.toObject();
            const createdSkill = await this.createAndAttachSkill(sourceData, `${skill.name} (${this.document.name})`);
            return createdSkill;
        }

        async detachSkill(skillId) {
            const skill = await this.getSkillById(skillId);
            if (!skill) return;

            await skill.delete();
            this.render();
        }

        async onDropSkill(event) {
            const dragData = TextEditor.getDragEventData(event);
            if (!dragData?.uuid) return;

            const droppedDocument = await fromUuid(dragData.uuid);
            await this.cloneAndAttachSkill(droppedDocument);
        }

        static async onCreateSkill(event, element) {
            event.preventDefault();

            const sourceData = { system: { quantity: WEAPON_SKILL_DEFAULTS.QUANTITY, isThrowable: WEAPON_SKILL_DEFAULTS.IS_THROWABLE }, effects: [], flags: {}, img: this.document.img };
            const createdSkill = await this.createAndAttachSkill(
                sourceData,
                game.i18n.format('WTTRPGEnhancements.WeaponSkillManager.NewSkillName', {
                    weapon: this.document.name
                }),
                ATTACH_MODES.WEAPON
            );

            createdSkill?.sheet?.render(true);
        }

        static async onOpenSkill(event, element) {
            event.preventDefault();
            const skill = await this.getSkillById(element.dataset.skillId);
            const sheet = skill?.sheet;
            if (!sheet) return;

            if (!sheet._weaponSkillManagerRefreshWrapped) {
                const originalClose = sheet.close.bind(sheet);
                sheet.close = async (...args) => {
                    const result = await originalClose(...args);
                    if (this.rendered) this.render(true);
                    return result;
                };
                sheet._weaponSkillManagerRefreshWrapped = true;
            }

            sheet.render(true);
        }

        static async onRemoveSkill(event, element) {
            event.preventDefault();
            await this.detachSkill(element.dataset.skillId);
        }
    };







