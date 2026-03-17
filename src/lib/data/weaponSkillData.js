import damageProperties from './templates/damagePropertiesData.js';

const fields = foundry.data.fields;

function deriveAttackMode(source) {
    const attackOptions = Array.isArray(source.attackOptions)
        ? source.attackOptions
        : Array.from(source.attackOptions ?? []);
    if (attackOptions.includes('ranged')) return 'ranged';
    if (attackOptions.includes('melee')) return 'melee';

    const meleeSkill = source.meleeAttackSkill ?? source.attackSkill ?? '';
    const rangedSkill = source.rangedAttackSkill ?? source.attackSkill ?? '';

    if (rangedSkill && CONFIG.WITCHER?.rangedSkills?.includes(rangedSkill)) return 'ranged';
    if (source.isThrowable || source.usingAmmo) return 'ranged';
    if (meleeSkill && CONFIG.WITCHER?.meleeSkills?.includes(meleeSkill)) return 'melee';

    return 'melee';
}

function deriveAttackOptions(source) {
    return [deriveAttackMode(source)];
}

function createWeaponTypeState(damageTypes = []) {
    const selectedTypes = Array.isArray(damageTypes) ? damageTypes : Array.from(damageTypes ?? []);
    const typeState = {
        text: '',
        slashing: selectedTypes.includes('slashing'),
        piercing: selectedTypes.includes('piercing'),
        bludgeoning: selectedTypes.includes('bludgeoning'),
        elemental: selectedTypes.includes('elemental')
    };

    const labels = [];
    if (typeState.slashing) labels.push(game.i18n.localize('WITCHER.DamageType.slashing'));
    if (typeState.piercing) labels.push(game.i18n.localize('WITCHER.DamageType.piercing'));
    if (typeState.bludgeoning) labels.push(game.i18n.localize('WITCHER.DamageType.bludgeoning'));
    if (typeState.elemental) labels.push(game.i18n.localize('WITCHER.DamageType.elemental'));
    typeState.text = labels.join(', ');

    return typeState;
}

function getEmbeddedItemIdFromUuid(uuid) {
    if (!uuid || typeof uuid !== 'string') return null;
    const match = uuid.match(/\.Item\.([^\.]+)$/);
    return match?.[1] ?? null;
}

/**
 * Data model for weapon skills.
 * Kept intentionally small: only fields used by the custom sheet,
 * system weaponAttack flow, or WitcherItem damage rolling.
 */
export default class WeaponSkillData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            description: new fields.HTMLField({ initial: '' }),

            parentWeaponUuid: new fields.StringField({
                initial: '',
                label: 'WTTRPGEnhancements.WeaponSkill.ParentWeaponUuid'
            }),

            damage: new fields.StringField({
                initial: '',
                label: 'WTTRPGEnhancements.WeaponSkill.DamageFormula'
            }),
            damageType: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                initial: [],
                label: 'WITCHER.Dialog.damageType'
            }),
            type: new fields.SchemaField({
                text: new fields.StringField({ initial: '' }),
                slashing: new fields.BooleanField({ initial: false }),
                piercing: new fields.BooleanField({ initial: false }),
                bludgeoning: new fields.BooleanField({ initial: false }),
                elemental: new fields.BooleanField({ initial: false })
            }),

            quantity: new fields.StringField({ initial: '1', label: 'WITCHER.Item.Quantity' }),
            range: new fields.StringField({ initial: '', label: 'WITCHER.Weapon.Range' }),
            accuracy: new fields.NumberField({ initial: 0, label: 'WITCHER.Weapon.Short.WeaponAccuracy' }),
            usingAmmo: new fields.BooleanField({ initial: false, label: 'WITCHER.Weapon.useAmmo' }),
            rollOnlyDmg: new fields.BooleanField({ initial: false, label: 'WITCHER.Weapon.onlyDmg' }),
            isThrowable: new fields.BooleanField({ initial: false, label: 'WITCHER.Weapon.isThrowable' }),

            attackOptions: new fields.SetField(new fields.StringField({ required: true, blank: false }), {
                initial: source => deriveAttackOptions(source),
                label: 'WITCHER.Attack.attackOptions.label',
                hint: 'WITCHER.Attack.attackOptions.hint'
            }),
            meleeAttackSkill: new fields.StringField({
                initial: source => source.attackSkill ?? source.meleeAttackSkill ?? '',
                label: 'WITCHER.Attack.meleeAttackSkill.label'
            }),
            rangedAttackSkill: new fields.StringField({
                initial: source => source.attackSkill ?? source.rangedAttackSkill ?? '',
                label: 'WITCHER.Attack.rangedAttackSkill.label'
            }),
            spellAttackSkill: new fields.StringField({
                initial: 'spellcasting',
                label: 'WITCHER.Attack.spellAttackSkill.label'
            }),
            itemUseAttackSkill: new fields.StringField({
                initial: '',
                label: 'WITCHER.Attack.itemUseAttackSkill.label'
            }),
            attackSkillOverrideMode: new fields.StringField({
                initial: 'none',
                label: 'WTTRPGEnhancements.WeaponSkill.AttackSkillOverrideLabel'
            }),
            attackSkillOverrideKey: new fields.StringField({ initial: '' }),
            applyMeleeBonus: new fields.BooleanField({
                initial: source => {
                    const skill = source.attackSkill ?? source.meleeAttackSkill ?? source.rangedAttackSkill ?? '';
                    return CONFIG.WITCHER?.meleeSkills?.includes(skill) ?? false;
                },
                label: 'WITCHER.Weapon.MeleeBonus'
            }),

            enhancementItemIds: new fields.ArrayField(new fields.StringField({ initial: '' }), { initial: [] }),
            damageProperties: new fields.SchemaField(damageProperties()),
            defenseOptions: new fields.ArrayField(new fields.StringField({ initial: '' }), {
                initial: [],
                label: 'WITCHER.Item.Settings.attacks.defendWith.label'
            })
        };
    }

    get parentWeapon() {
        if (!this.parentWeaponUuid) return null;

        const actor = this.parent?.actor;
        if (actor) {
            const embeddedItemId = getEmbeddedItemIdFromUuid(this.parentWeaponUuid);
            const sameActorPrefix = `${actor.uuid}.Item.`;
            if (this.parentWeaponUuid.startsWith(sameActorPrefix) && embeddedItemId) {
                return actor.items.get(embeddedItemId) ?? null;
            }
        }

        try {
            return fromUuidSync(this.parentWeaponUuid);
        } catch {
            return null;
        }
    }

    getAttackSkillReplacement(actor = this.parent?.actor) {
        if (!actor || this.attackSkillOverrideMode === 'none' || !this.attackSkillOverrideKey) return null;

        if (this.attackSkillOverrideMode === 'standard') {
            const skillMapEntry = CONFIG.WITCHER?.skillMap?.[this.attackSkillOverrideKey];
            const stat = skillMapEntry?.attribute?.name;
            const level = actor.system?.skills?.[stat]?.[this.attackSkillOverrideKey]?.value;
            if (!skillMapEntry || !stat || level === undefined) return null;

            return {
                skillName: game.i18n.localize(skillMapEntry.label),
                stat,
                level
            };
        }

        if (this.attackSkillOverrideMode === 'custom') {
            const customSkill = actor.items?.find(item => item.type === 'skill' && item.name === this.attackSkillOverrideKey);
            const stat = customSkill?.system?.attribute;
            const level = customSkill?.system?.value;
            if (!customSkill || !stat) return null;

            return {
                skillName: customSkill.name,
                stat,
                level: level ?? 0
            };
        }

        return null;
    }

    prepareDerivedData() {
        if (!Array.isArray(this.damageType)) this.damageType = [];
        if (!Array.isArray(this.defenseOptions)) this.defenseOptions = [];
        if (!(this.attackOptions instanceof Set)) this.attackOptions = new Set(this.attackOptions ?? []);
        if (!this.attackSkillOverrideMode) this.attackSkillOverrideMode = 'none';
        this.quantity = '1';
        this.isThrowable = false;

        const parentWeapon = this.parentWeapon?.system;
        if (!this.attackOptions.size) {
            this.attackOptions = new Set(parentWeapon?.attackOptions ?? deriveAttackOptions(this));
        }

        const attackMode = Array.from(this.attackOptions)[0] ?? deriveAttackMode(this);
        this.attackOptions = new Set([attackMode]);

        if (attackMode === 'melee') {
            this.rangedAttackSkill = '';
            this.usingAmmo = false;
            this.isThrowable = false;
            this.accuracy = 0;
        } else {
            this.applyMeleeBonus = false;
        }

        if (!this.damageType.length && parentWeapon?.type) {
            this.damageType = Object.entries(parentWeapon.type)
                .filter(([key, enabled]) => key !== 'text' && !!enabled)
                .map(([key]) => key);
        }

        const derivedType = createWeaponTypeState(this.damageType);
        this.type.text = derivedType.text;
        this.type.slashing = derivedType.slashing;
        this.type.piercing = derivedType.piercing;
        this.type.bludgeoning = derivedType.bludgeoning;
        this.type.elemental = derivedType.elemental;

        const enhancementItemIds = this.enhancementItemIds ?? [];
        if (enhancementItemIds.length > 0 && this.parent?.actor?.items) {
            this.enhancementItems = [];
            for (const itemId of enhancementItemIds) {
                const item = this.parent.actor.items.get(itemId);
                if (!item) continue;
                this.enhancementItems.push({
                    name: item.name,
                    img: item.img,
                    system: item.system,
                    id: itemId
                });
            }
        }
    }

    isEnoughThrowable() {
        return this.isThrowable ? Number(this.quantity ?? 0) > 0 : false;
    }
}

