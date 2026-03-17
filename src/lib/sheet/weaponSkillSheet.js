import { getWeaponSkillParentWeapon } from '../util/weaponSkill.js';
import { FLAG_KEYS, MODULE, TEMPLATE_PATHS } from '../util/constants.js';
import { LifeStealMixin } from '../mixin/lifestealMixin.js';

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Sheet for editing weapon skills.
 */
export default class WeaponSkillSheet extends LifeStealMixin(HandlebarsApplicationMixin(ItemSheetV2)) {
    static DEFAULT_OPTIONS = {
        position: {
            width: 820,
            height: 760
        },
        window: {
            icon: 'fas fa-sword',
            title: 'WTTRPGEnhancements.WeaponSkill.SheetTitle'
        },
        form: {
            handler: WeaponSkillSheet.saveData,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            create: WeaponSkillSheet.onManageActiveEffect,
            toggle: WeaponSkillSheet.onManageActiveEffect,
            edit: WeaponSkillSheet.onManageActiveEffect,
            delete: WeaponSkillSheet.onManageActiveEffect,
            addEffect: WeaponSkillSheet.onAddDamagePropertyEffect,
            removeEffect: WeaponSkillSheet.onRemoveDamagePropertyEffect
        }
    };

    static PARTS = {
        tabs: {
            template: TEMPLATE_PATHS.NAVIGATION
        },
        general: {
            template: TEMPLATE_PATHS.SHEET_WEAPON_SKILL,
            scrollable: ['']
        },
        lifesteal: {
            template: TEMPLATE_PATHS.SHEET_LIFESTEAL,
            scrollable: ['']
        },
        damageProperties: {
            template: 'systems/TheWitcherTRPG/templates/sheets/item/configuration/tabs/damagePropertiesConfiguration.hbs',
            scrollable: ['']
        },
        activeEffects: {
            template: 'systems/TheWitcherTRPG/templates/sheets/item/configuration/tabs/activeEffectConfiguration.hbs',
            scrollable: ['']
        }
    };

    static TABS = {
        primary: {
            tabs: [
                { id: 'general', icon: 'fas fa-sword' },
                { id: 'lifesteal', icon: 'fas fa-people-robbery', label: 'WTTRPGEnhancements.Enhancements.lifesteal' },
                { id: 'damageProperties', icon: 'fas fa-burst' },
                { id: 'activeEffects', icon: 'fas fa-bolt' }
            ],
            initial: 'general',
            labelPrefix: 'WITCHER.Item.Settings'
        }
    };

    static parseAttackSkillOverride(value) {
        if (!value) return { mode: 'none', key: '' };
        const separatorIndex = value.indexOf(':');
        if (separatorIndex === -1) return { mode: 'none', key: '' };

        return {
            mode: value.slice(0, separatorIndex),
            key: value.slice(separatorIndex + 1)
        };
    }

    static normalizeArrayValue(value, fallback = []) {
        if (Array.isArray(value)) return value.filter(entry => entry !== undefined && entry !== null && entry !== '');
        if (value && typeof value === 'object') {
            return Object.values(value).filter(entry => entry !== undefined && entry !== null && entry !== '');
        }
        if (value === undefined || value === null || value === '') return fallback;
        return [value];
    }

    static toNumber(value, fallback = 0) {
        if (value === undefined || value === null || value === '') return fallback;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    static async saveData(event, form, formData) {
        const data = foundry.utils.expandObject(formData.object ?? {});
        const currentAttackMode = Array.from(this.document.system.attackOptions ?? [])[0] ?? 'melee';
        const attackMode = data.system?.attackMode ?? currentAttackMode;
        const isRanged = attackMode === 'ranged';
        const attackSkillOverride = WeaponSkillSheet.parseAttackSkillOverride(data.system?.attackSkillOverride ?? '');
        const lifestealData = data.lifesteal ?? {};
        const systemData = data.system ?? {};

        const updateData = {
            name: data.name ?? this.document.name,
            flags: {
                [MODULE.FLAGS_KEY]: {
                    ...(this.document.flags?.[MODULE.FLAGS_KEY] ?? {}),
                    [FLAG_KEYS.LIFESTEAL]: {
                        enabled: !!lifestealData.enabled,
                        flatPercentage: WeaponSkillSheet.toNumber(
                            lifestealData.flatPercentage,
                            this.document.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]?.flatPercentage ?? 100
                        ),
                        storeOverheal: !!lifestealData.storeOverheal,
                        overhealPercentage: WeaponSkillSheet.toNumber(
                            lifestealData.overhealPercentage,
                            this.document.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]?.overhealPercentage ?? 100
                        ),
                        overhealThreshold: WeaponSkillSheet.toNumber(
                            lifestealData.overhealThreshold,
                            this.document.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]?.overhealThreshold ?? 0
                        )
                    }
                }
            },
            system: {
                description: systemData.description ?? this.document.system.description ?? '',
                parentWeaponUuid: systemData.parentWeaponUuid ?? this.document.system.parentWeaponUuid ?? '',
                damage: systemData.damage ?? this.document.system.damage ?? '',
                damageType: WeaponSkillSheet.normalizeArrayValue(systemData.damageType),
                attackOptions: [attackMode],
                meleeAttackSkill: systemData.meleeAttackSkill ?? this.document.system.meleeAttackSkill ?? '',
                rangedAttackSkill: isRanged ? (systemData.rangedAttackSkill ?? this.document.system.rangedAttackSkill ?? '') : '',
                attackSkillOverrideMode: attackSkillOverride.mode,
                attackSkillOverrideKey: attackSkillOverride.key,
                applyMeleeBonus: attackMode === 'melee' ? !!systemData.applyMeleeBonus : false,
                isThrowable: false,
                quantity: '1',
                accuracy: isRanged ? WeaponSkillSheet.toNumber(systemData.accuracy, this.document.system.accuracy ?? 0) : 0,
                range: systemData.range ?? this.document.system.range ?? '',
                rollOnlyDmg: !!systemData.rollOnlyDmg,
                usingAmmo: isRanged ? !!systemData.usingAmmo : false,
                defenseOptions: WeaponSkillSheet.normalizeArrayValue(systemData.defenseOptions),
                damageProperties: foundry.utils.deepClone(systemData.damageProperties ?? this.document.system.damageProperties ?? {})
            }
        };

        await this.document.update(updateData, { render: true });
    }

    buildAttackSkillOverrideOptions() {
        const options = [{
            value: '',
            label: game.i18n.localize('WTTRPGEnhancements.WeaponSkill.AttackSkillOverrideDefault')
        }];

        const standardSkills = Object.values(CONFIG.WITCHER?.skillMap ?? {})
            .map(skill => ({
                value: `standard:${skill.name}`,
                label: game.i18n.localize(skill.label)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        options.push(...standardSkills);

        const customSkills = (this.document.actor?.items ?? [])
            .filter(item => item.type === 'skill')
            .map(skill => ({
                value: `custom:${skill.name}`,
                label: `${game.i18n.localize('WTTRPGEnhancements.WeaponSkill.CustomSkillPrefix')}: ${skill.name}`
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        options.push(...customSkills);

        const currentValue = this.document.system.attackSkillOverrideMode && this.document.system.attackSkillOverrideMode !== 'none'
            ? `${this.document.system.attackSkillOverrideMode}:${this.document.system.attackSkillOverrideKey ?? ''}`
            : '';

        if (currentValue && !options.some(option => option.value === currentValue)) {
            options.push({
                value: currentValue,
                label: this.document.system.attackSkillOverrideKey
            });
        }

        return options.map(option => ({
            ...option,
            selected: option.value === currentValue
        }));
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const parentWeapon = getWeaponSkillParentWeapon(this.document.system, this.document);
        const supportedDamageTypes = new Set(['slashing', 'piercing', 'bludgeoning', 'elemental']);
        const damageTypes = (CONFIG.WITCHER?.damageTypes ?? [])
            .filter(type => supportedDamageTypes.has(type.value))
            .map(type => ({
                ...type,
                checked: (this.document.system.damageType ?? []).includes(type.value)
            }));
        const defenseOptions = (CONFIG.WITCHER?.defenseOptions ?? []).map(option => ({
            ...option,
            checked: (this.document.system.defenseOptions ?? []).includes(option.value)
        }));
        const selectedAttackMode = Array.from(this.document.system.attackOptions ?? [])[0] ?? 'melee';
        const attackOptions = (CONFIG.WITCHER?.attackOptions ?? [])
            .filter(option => ['melee', 'ranged'].includes(option.value))
            .map(option => ({
                ...option,
                checked: selectedAttackMode === option.value
            }));
        const meleeAttackSkills = (CONFIG.WITCHER?.meleeSkills ?? []).map(skill => CONFIG.WITCHER.skillMap?.[skill]).filter(Boolean);
        const rangedAttackSkills = (CONFIG.WITCHER?.rangedSkills ?? []).map(skill => CONFIG.WITCHER.skillMap?.[skill]).filter(Boolean);

        context.item = this.document;
        this._prepareLifestealtContext(context);
        context.editable = this.isEditable;
        context.config = CONFIG.WITCHER;
        context.settings = {
            silverTrait: game.settings.get('TheWitcherTRPG', 'silverTrait')
        };
        context.systemFields = this.document.system.schema.fields;
        context.effects = this.prepareActiveEffectCategories(this.document.effects);
        context.damageTypes = damageTypes;
        context.defenseOptions = defenseOptions;
        context.attackOptions = attackOptions;
        context.attackSkillOverrideOptions = this.buildAttackSkillOverrideOptions();
        context.selectedAttackMode = selectedAttackMode;
        context.meleeAttackSkills = meleeAttackSkills;
        context.rangedAttackSkills = rangedAttackSkills;
        context.hasMeleeAttack = selectedAttackMode === 'melee';
        context.hasRangedAttack = selectedAttackMode === 'ranged';
        context.enrichedText = {
            description: {
                enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    this.document.system.description ?? ''
                ),
                value: this.document.system.description ?? '',
                systemField: this.document.system.schema.getField('description')
            }
        };
        context.parentWeapon = parentWeapon
            ? {
                  name: parentWeapon.name,
                  img: parentWeapon.img,
                  uuid: parentWeapon.uuid
              }
            : null;
        context.tabs = this._prepareTabs('primary');

        return context;
    }

    _onChangeForm(formConfig, event) {
        super._onChangeForm(formConfig, event);
        if (event.target.dataset.action === 'editEffect') {
            this.onEditDamagePropertyEffect(event, event.target);
        }
    }

    prepareActiveEffectCategories(effects) {
        const categories = {
            temporary: {
                type: 'temporary',
                label: game.i18n.localize('WITCHER.activeEffect.temporary'),
                effects: []
            },
            passive: {
                type: 'passive',
                label: game.i18n.localize('WITCHER.activeEffect.passive'),
                effects: []
            },
            inactive: {
                type: 'inactive',
                label: game.i18n.localize('WITCHER.activeEffect.inactive'),
                effects: []
            },
            temporaryItemImprovement: {
                type: 'temporaryItemImprovement',
                label: game.i18n.localize('WITCHER.activeEffect.temporaryItemImprovement'),
                effects: []
            }
        };

        for (const effect of effects) {
            if (effect.disabled) categories.inactive.effects.push(effect);
            else if (effect.isTemporaryItemImprovement && !effect.isAppliedTemporaryItemImprovement) {
                categories.temporaryItemImprovement.effects.push(effect);
            } else if (effect.isTemporary) categories.temporary.effects.push(effect);
            else categories.passive.effects.push(effect);
        }

        return categories;
    }

    static async onManageActiveEffect(event, element) {
        event.preventDefault();
        const li = element.closest('li');
        const effect = li?.dataset.effectId ? this.document.effects.get(li.dataset.effectId) : null;

        switch (element.dataset.action) {
            case 'create':
                return this.document.createEmbeddedDocuments('ActiveEffect', [
                    {
                        type: li?.dataset.effectType === 'temporaryItemImprovement' ? 'temporaryItemImprovement' : 'base',
                        name: this.document.name,
                        icon: this.document.img,
                        origin: this.document.uuid,
                        duration: {
                            rounds: li?.dataset.effectType === 'temporary' ? 1 : undefined
                        },
                        disabled: li?.dataset.effectType === 'inactive'
                    }
                ]);
            case 'edit':
                return effect?.sheet.render(true);
            case 'delete':
                return effect?.delete();
            case 'toggle':
                return effect?.update({ disabled: !effect.disabled });
        }
    }

    static async onAddDamagePropertyEffect(event, element) {
        event.preventDefault();
        const target = element.dataset.target;
        const newList = foundry.utils.deepClone(foundry.utils.getProperty(this.item, target) ?? []);
        newList.push({ percentage: 0 });
        return this.item.update({ [target]: newList });
    }

    async onEditDamagePropertyEffect(event, element) {
        event.preventDefault();

        const itemId = element.closest('.list-item')?.dataset.id;
        const target = element.dataset.target;
        const field = element.dataset.field;
        let value = element.value;

        if (value === 'on') value = element.checked;

        const effects = foundry.utils.deepClone(foundry.utils.getProperty(this.item, target) ?? []);
        const effectIndex = effects.findIndex(effect => effect.id === itemId);
        if (effectIndex === -1) return;

        effects[effectIndex][field] = value;
        return this.item.update({ [target]: effects });
    }

    static async onRemoveDamagePropertyEffect(event, element) {
        event.preventDefault();

        const target = element.dataset.target;
        const itemId = element.closest('.list-item')?.dataset.id;
        const newList = (foundry.utils.getProperty(this.item, target) ?? []).filter(effect => effect.id !== itemId);
        return this.item.update({ [target]: newList });
    }
}

