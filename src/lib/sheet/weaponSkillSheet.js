import { getWeaponSkillParentWeapon } from '../util/weaponSkill.js';
import { ATTACK_MODES, ATTACK_SKILL_OVERRIDE_MODES, FLAG_KEYS, ITEM_TYPES, MODULE, TEMPLATE_PATHS, WEAPON_SKILL_DEFAULTS } from '../util/constants.js';
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

    static getSystemWeaponSheetClass() {
        const sheets = CONFIG.Item?.sheetClasses?.weapon ?? {};
        return sheets['witcher.WitcherWeaponSheet']?.cls
            ?? Object.values(sheets).find(entry => entry?.id?.startsWith('witcher.'))?.cls
            ?? Object.values(sheets).find(entry => entry?.default)?.cls
            ?? null;
    }

    static parseAttackSkillOverride(value) {
        if (!value) return { mode: ATTACK_SKILL_OVERRIDE_MODES.NONE, key: '' };
        const separatorIndex = value.indexOf(':');
        if (separatorIndex === -1) return { mode: ATTACK_SKILL_OVERRIDE_MODES.NONE, key: '' };

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
        const currentAttackMode = Array.from(this.document.system.attackOptions ?? [])[0] ?? ATTACK_MODES.MELEE;
        const attackMode = data.system?.attackMode ?? currentAttackMode;
        const isRanged = attackMode === ATTACK_MODES.RANGED;
        const attackSkillOverride = WeaponSkillSheet.parseAttackSkillOverride(data.system?.attackSkillOverride ?? '');
        const lifestealData = data.lifesteal ?? {};
        const systemData = data.system ?? {};

        const updateData = {
            name: data.name ?? this.document.name,
            img: data.img ?? this.document.img,
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
                applyMeleeBonus: attackMode === ATTACK_MODES.MELEE ? !!systemData.applyMeleeBonus : false,
                isThrowable: WEAPON_SKILL_DEFAULTS.IS_THROWABLE,
                quantity: WEAPON_SKILL_DEFAULTS.QUANTITY,
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

    getSystemPropertiesConfiguration() {
        if (this._systemPropertiesConfiguration?.application?.document === this.document) {
            return this._systemPropertiesConfiguration;
        }

        const WeaponSheetClass = this.constructor.getSystemWeaponSheetClass();
        if (!WeaponSheetClass) return null;

        const weaponSheet = new WeaponSheetClass(this.document);
        const configuration = weaponSheet.configuration ?? null;
        if (configuration) {
            configuration.application ??= weaponSheet;
            this._systemPropertiesConfiguration = configuration;
        }
        return configuration;
    }

    buildAttackSkillOverrideOptions() {
        const options = [{
            value: '',
            label: game.i18n.localize('WTTRPGEnhancements.WeaponSkill.AttackSkillOverrideDefault')
        }];

        const standardSkills = Object.values(CONFIG.WITCHER?.skillMap ?? {})
            .map(skill => ({
                value: `${ATTACK_SKILL_OVERRIDE_MODES.STANDARD}:${skill.name}`,
                label: game.i18n.localize(skill.label)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        options.push(...standardSkills);

        const customSkills = (this.document.actor?.items ?? [])
            .filter(item => item.type === ITEM_TYPES.SKILL)
            .map(skill => ({
                value: `${ATTACK_SKILL_OVERRIDE_MODES.CUSTOM}:${skill.name}`,
                label: `${game.i18n.localize('WTTRPGEnhancements.WeaponSkill.CustomSkillPrefix')}: ${skill.name}`
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        options.push(...customSkills);

        const currentValue = this.document.system.attackSkillOverrideMode && this.document.system.attackSkillOverrideMode !== ATTACK_SKILL_OVERRIDE_MODES.NONE
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
        const selectedAttackMode = Array.from(this.document.system.attackOptions ?? [])[0] ?? ATTACK_MODES.MELEE;
        const attackOptions = (CONFIG.WITCHER?.attackOptions ?? [])
            .filter(option => [ATTACK_MODES.MELEE, ATTACK_MODES.RANGED].includes(option.value))
            .map(option => ({
                ...option,
                checked: selectedAttackMode === option.value
            }));
        const meleeAttackSkills = (CONFIG.WITCHER?.meleeSkills ?? []).map(skill => CONFIG.WITCHER.skillMap?.[skill]).filter(Boolean);
        const rangedAttackSkills = (CONFIG.WITCHER?.rangedSkills ?? []).map(skill => CONFIG.WITCHER.skillMap?.[skill]).filter(Boolean);
        const systemPropertiesConfiguration = this.getSystemPropertiesConfiguration();

        context.item = this.document;
        this._prepareLifestealtContext(context);
        context.editable = this.isEditable;
        context.config = CONFIG.WITCHER;
        context.settings = {
            silverTrait: game.settings.get('TheWitcherTRPG', 'silverTrait')
        };
        context.systemFields = this.document.system.schema.fields;
        context.effects = systemPropertiesConfiguration
            ? systemPropertiesConfiguration.prepareActiveEffectCategories(this.document.effects)
            : [];
        context.damageTypes = damageTypes;
        context.defenseOptions = defenseOptions;
        context.attackOptions = attackOptions;
        context.attackSkillOverrideOptions = this.buildAttackSkillOverrideOptions();
        context.selectedAttackMode = selectedAttackMode;
        context.meleeAttackSkills = meleeAttackSkills;
        context.rangedAttackSkills = rangedAttackSkills;
        context.hasMeleeAttack = selectedAttackMode === ATTACK_MODES.MELEE;
        context.hasRangedAttack = selectedAttackMode === ATTACK_MODES.RANGED;
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
            const systemPropertiesConfiguration = this.getSystemPropertiesConfiguration();
            if (systemPropertiesConfiguration?._onEditEffect) {
                return systemPropertiesConfiguration._onEditEffect(event, event.target);
            }
        }
    }

    static async onManageActiveEffect(event, element) {
        const systemPropertiesConfiguration = this.getSystemPropertiesConfiguration?.();
        if (systemPropertiesConfiguration?.constructor?.onManageActiveEffect) {
            return systemPropertiesConfiguration.constructor.onManageActiveEffect.call(systemPropertiesConfiguration, event, element);
        }
    }

    static async onAddDamagePropertyEffect(event, element) {
        const systemPropertiesConfiguration = this.getSystemPropertiesConfiguration?.();
        if (systemPropertiesConfiguration?.constructor?._onAddEffect) {
            return systemPropertiesConfiguration.constructor._onAddEffect.call(systemPropertiesConfiguration, event, element);
        }
    }

    static async onRemoveDamagePropertyEffect(event, element) {
        const systemPropertiesConfiguration = this.getSystemPropertiesConfiguration?.();
        if (systemPropertiesConfiguration?.constructor?._oRemoveEffect) {
            return systemPropertiesConfiguration.constructor._oRemoveEffect.call(systemPropertiesConfiguration, event, element);
        }
    }
}





