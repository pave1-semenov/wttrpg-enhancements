import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import { getAllLocationOptions } from "../util/location.js";
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
            template: "templates/generic/tab-navigation.hbs",
        },
        dot: {
            template: "modules/wttrpg-enhancements/templates/sheet/dot.hbs",
            scrollable: [""]
        },
        lifesteal: {
            template: "modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs",
            scrollable: [""]
        },
        amplifier: {
            template: "modules/wttrpg-enhancements/templates/sheet/amplifier.hbs",
            scrollable: [""]
        }
    }


    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "dot", icon: "fas fa-heart-pulse" },
                { id: "lifesteal", icon: "fas fa-people-robbery" },
                { id: "amplifier", icon: "fas fa-hand-fist" }
            ],
            initial: 'dot',
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
            dot: {
                damageProperties: {}
            },
            lifesteal: {},
            amp: {}
        }

        const prefixesConfig = [
            { prefix: 'dot.', target: updateData.dot },
            { prefix: 'damageProperties.', target: updateData.dot.damageProperties },
            { prefix: 'lifesteal.', target: updateData.lifesteal },
            { prefix: 'amp.', target: updateData.amp }
        ]

        return this._fillUpdateData(formData, updateData, prefixesConfig)
    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options)

        this._prepareLifestealtContext(context)
        this._prepareDotContext(context)    
        this._prepareAmplifiersContext(context)

        context.tabs = this._prepareTabs("primary")

        return context
    }

    async _prepareDotContext(context) {
        const dotData = foundry.utils.getProperty(this.document, 'flags.wttrpg-enhancements.dot')
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
        context.data.dot = data

        return context
    }

    async _prepareAmplifiersContext(context) {
        const ampData = foundry.utils.getProperty(this.document, 'flags.wttrpg-enhancements.amp')
        const data = ampData ? ampData : {
            enabled: false,
            damageType: '',
            multiplier: 0,
            variableFormula: ''
        }
        data.damageTypes = [{ label: 'All', value: 'all' }, ...CONFIG.WITCHER.damageTypes]
        if (!context.data) context.data = {}

        context.data.amp = data

        return context
    }

}