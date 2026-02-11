import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import { getAllLocationOptions } from "../util/location.js";
import { ENHANCEMENT_KEYS, FLAG_PATHS, FORM_PREFIXES, TEMPLATE_PATHS } from "../util/constants.js";
import DefauldDocumentSheet from "./defaultSheet.js"

export default class ActiveEffectsEnhancementsSheet extends LifeStealMixin((DefauldDocumentSheet)) {
    static DEFAULT_OPTIONS = {
        position: {
            width: 700,
            height: 700
        },
        form: {
            handler: ActiveEffectsEnhancementsSheet.handleEnancements,
            submitOnChange: true,
            closeOnSubmit: false
        }
    }

    static PARTS = {
        tabs: {
            template: TEMPLATE_PATHS.NAVIGATION,
        },
        [ENHANCEMENT_KEYS.DOT]: {
            template: TEMPLATE_PATHS.SHEET_DOT,
            scrollable: [""]
        },
        [ENHANCEMENT_KEYS.HOT]: {
            template: TEMPLATE_PATHS.SHEET_HOT,
            scrollable: [""]
        },
        [ENHANCEMENT_KEYS.LIFESTEAL]: {
            template: TEMPLATE_PATHS.SHEET_LIFESTEAL,
            scrollable: [""]
        },
        [ENHANCEMENT_KEYS.AMP]: {
            template: TEMPLATE_PATHS.SHEET_AMPLIFIER,
            scrollable: [""]
        }
    }


    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: ENHANCEMENT_KEYS.DOT, icon: "fas fa-heart-pulse" },
                { id: ENHANCEMENT_KEYS.HOT, icon: "fas fa-hand-holding-medical" },
                { id: ENHANCEMENT_KEYS.LIFESTEAL, icon: "fas fa-people-robbery" },
                { id: ENHANCEMENT_KEYS.AMP, icon: "fas fa-hand-fist" }
            ],
            initial: ENHANCEMENT_KEYS.DOT,
            labelPrefix: 'WTTRPGEnhancements.Enhancements'
        }
    }

    /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
    static async handleEnancements(event, form, formData) {
        const update = await this._prepareUpdateData(formData)

        await this.document.update(update)
    }

    async _prepareUpdateData(formData) {
        let updateData = {
            [ENHANCEMENT_KEYS.DOT]: {
                damageProperties: {}
            },
            [ENHANCEMENT_KEYS.HOT]: {},
            [ENHANCEMENT_KEYS.LIFESTEAL]: {},
            [ENHANCEMENT_KEYS.AMP]: {}
        }

        const prefixesConfig = [
            { prefix: FORM_PREFIXES.DOT, target: updateData[ENHANCEMENT_KEYS.DOT] },
            { prefix: FORM_PREFIXES.DAMAGE_PROPERTIES, target: updateData[ENHANCEMENT_KEYS.DOT].damageProperties },
            { prefix: FORM_PREFIXES.HOT, target: updateData[ENHANCEMENT_KEYS.HOT] },
            { prefix: FORM_PREFIXES.LIFESTEAL, target: updateData[ENHANCEMENT_KEYS.LIFESTEAL] },
            { prefix: FORM_PREFIXES.AMP, target: updateData[ENHANCEMENT_KEYS.AMP] }
        ]

        return this._fillUpdateData(formData, updateData, prefixesConfig)
    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options)

        this._prepareLifestealtContext(context)
        this._prepareDotContext(context)
        this._prepareHotContext(context)
        this._prepareAmplifiersContext(context)

        context.tabs = this._prepareTabs("primary")

        return context
    }

    async _prepareDotContext(context) {
        const dotData = foundry.utils.getProperty(this.document, FLAG_PATHS.DOT)
        const data = dotData ? dotData : {
            enabled: false,
            formula: '',
            autoApply: false,
            location: 'torso',
            damageType: 'slashing',
            damageProperties: {
                inherit: false,
                armorPiercing: false,
                improvedArmorPiercing: false,
                ablating: false,
                crushingForce: false,
                damageToAllLocations: false,
                bypassesWornArmor: false,
                bypassesNaturalArmor: false,
                silverDamage: '',
                isMeteorite: false,
                isNonLethal: false,
                spDamage: '',
            },
        }
        data.damageTypes = CONFIG.WITCHER.damageTypes
        data.locations = getAllLocationOptions()

        if (!context.data) context.data = {}
        context.data[ENHANCEMENT_KEYS.DOT] = data

        return context
    }

    async _prepareHotContext(context) {
        const hotData = foundry.utils.getProperty(this.document, FLAG_PATHS.HOT)
        const data = hotData ? hotData : {
            enabled: false,
            formula: ''
        }

        if (!context.data) context.data = {}
        context.data[ENHANCEMENT_KEYS.HOT] = data

        return context
    }

    async _prepareAmplifiersContext(context) {
        const ampData = foundry.utils.getProperty(this.document, FLAG_PATHS.AMP)
        const data = ampData ? ampData : {
            enabled: false,
            damageType: '',
            multiplier: 0,
            variableFormula: ''
        }
        data.damageTypes = [{ label: 'All', value: 'all' }, ...CONFIG.WITCHER.damageTypes]
        if (!context.data) context.data = {}

        context.data[ENHANCEMENT_KEYS.AMP] = data

        return context
    }

}
