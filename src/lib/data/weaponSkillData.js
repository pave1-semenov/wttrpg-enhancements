import { ATTACK_MODES, ATTACK_SKILL_OVERRIDE_MODES, WEAPON_SKILL_DEFAULTS } from '../util/constants.js';
import {
    createWeaponSkillTypeState,
    deriveWeaponSkillAttackMode,
    deriveWeaponSkillAttackOptions,
    getWeaponSkillParentWeapon
} from '../util/weaponSkill.js';

const fields = foundry.data.fields;
let weaponSkillDataModelClass = null;

export default function getWeaponSkillDataModel() {
    if (weaponSkillDataModelClass) return weaponSkillDataModelClass;

    const BaseWeaponData = CONFIG.Item?.dataModels?.weapon ?? foundry.abstract.TypeDataModel;

    weaponSkillDataModelClass = class WeaponSkillData extends BaseWeaponData {
        static defineSchema() {
            const baseSchema = super.defineSchema();
            return {
                ...baseSchema,
                description: new fields.HTMLField({ initial: '' }),
                parentWeaponUuid: new fields.StringField({
                    initial: '',
                    label: 'WTTRPGEnhancements.WeaponSkill.ParentWeaponUuid'
                }),
                condition: new fields.StringField({
                    initial: '',
                    label: 'WTTRPGEnhancements.WeaponSkill.ConditionLabel'
                }),
                inheritDamage: new fields.BooleanField({
                    initial: true,
                    label: 'WTTRPGEnhancements.WeaponSkill.InheritDamage'
                }),
                damageType: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                    initial: [],
                    label: 'WITCHER.Dialog.damageType'
                }),
                targetLocations: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                    initial: [],
                    label: 'WTTRPGEnhancements.WeaponSkill.TargetLocationsLabel'
                }),
                allowedStrikes: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                    initial: [],
                    label: 'WTTRPGEnhancements.WeaponSkill.AllowedStrikesLabel'
                }),
                attackCount: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    label: 'WTTRPGEnhancements.WeaponSkill.AttackCountLabel'
                }),
                staminaCost: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    label: 'WTTRPGEnhancements.WeaponSkill.StaminaCostLabel'
                }),
                additionalDefenseSkills: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                    initial: [],
                    label: 'WTTRPGEnhancements.WeaponSkill.AdditionalDefenseSkillsLabel'
                }),
                attackSkillOverrideMode: new fields.StringField({
                    initial: ATTACK_SKILL_OVERRIDE_MODES.NONE,
                    label: 'WTTRPGEnhancements.WeaponSkill.AttackSkillOverrideLabel'
                }),
                attackSkillOverrideKey: new fields.StringField({ initial: '' })
            };
        }

        prepareDerivedData() {
            super.prepareDerivedData();

            if (!Array.isArray(this.damageType)) this.damageType = [];
            if (!Array.isArray(this.targetLocations)) this.targetLocations = [];
            if (!Array.isArray(this.allowedStrikes)) this.allowedStrikes = [];
            if (!Array.isArray(this.additionalDefenseSkills)) this.additionalDefenseSkills = [];
            this.attackCount = Math.max(0, Math.trunc(Number(this.attackCount) || 0));
            this.staminaCost = Math.max(0, Math.trunc(Number(this.staminaCost) || 0));
            if (!Array.isArray(this.defenseOptions)) this.defenseOptions = Array.from(this.defenseOptions ?? []);
            if (!(this.attackOptions instanceof Set)) this.attackOptions = new Set(this.attackOptions ?? []);
            if (!this.attackSkillOverrideMode) this.attackSkillOverrideMode = ATTACK_SKILL_OVERRIDE_MODES.NONE;
            this.quantity = WEAPON_SKILL_DEFAULTS.QUANTITY;
            this.isThrowable = WEAPON_SKILL_DEFAULTS.IS_THROWABLE;

            const parentWeapon = getWeaponSkillParentWeapon(this, this.parent)?.system;
            if (this.inheritDamage && parentWeapon) {
                this.damage = parentWeapon.damage ?? '';
            }

            if (!this.attackOptions.size) {
                const parentAttackOptions = parentWeapon?.attackOptions;
                this.attackOptions = new Set(
                    parentAttackOptions instanceof Set
                        ? Array.from(parentAttackOptions)
                        : parentAttackOptions ?? deriveWeaponSkillAttackOptions(this)
                );
            }

            const attackMode = Array.from(this.attackOptions)[0] ?? deriveWeaponSkillAttackMode(this);
            this.attackOptions = new Set([attackMode]);

            if (attackMode === ATTACK_MODES.MELEE) {
                this.rangedAttackSkill = '';
                this.usingAmmo = false;
                this.isThrowable = WEAPON_SKILL_DEFAULTS.IS_THROWABLE;
            } else {
                this.applyMeleeBonus = false;
            }

            if (!this.damageType.length && parentWeapon?.type) {
                this.damageType = Object.entries(parentWeapon.type)
                    .filter(([key, enabled]) => key !== 'text' && !!enabled)
                    .map(([key]) => key);
            }

            const derivedType = createWeaponSkillTypeState(this.damageType);
            this.type.text = derivedType.text;
            this.type.slashing = derivedType.slashing;
            this.type.piercing = derivedType.piercing;
            this.type.bludgeoning = derivedType.bludgeoning;
            this.type.elemental = derivedType.elemental;
            this.type.electricity = derivedType.electricity;
            this.type.fire = derivedType.fire;
            this.type.ice = derivedType.ice;
        }

    };

    return weaponSkillDataModelClass;
}


