import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import { getAllLocationOptions } from "../util/location.js";
import DefaultTabbedDocumentSheet from "./defaultTabbedSheet.js"

export default class ActiveEffectsEnhancementsSheet extends LifeStealMixin((DefaultTabbedDocumentSheet)) {
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
            container: { classes: ["tab-body"], id: "tabs" },
            template: "modules/wttrpg-enhancements/templates/sheet/dot.hbs",
            scrollable: [""]
        },
        lifesteal: {
            container: { classes: ["tab-body"], id: "tabs" },
            template: "modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs",
            scrollable: [""]
        },
        amplifier: {
            container: { classes: ["tab-body"], id: "tabs" },
            template: "modules/wttrpg-enhancements/templates/sheet/amplifier.hbs",
            scrollable: [""]
        }
    }

    /** @override */
    static TABS = [
        { tab: "dot", label: "DOT", icon: "fas fa-heart-pulse", "active": true },
        { tab: "lifesteal", label: "lifesteal", icon: "fas fa-people-robbery" },
        { tab: "amplifier", label: "amplifiers", icon: "fas fa-hand-fist" }
    ];

    tabGroups = {
        primary: "dot"
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
            { prefix: 'amp.', target: updateData.amp}
        ]

        return this._fillUpdateData(formData, updateData, prefixesConfig)
    }

    async _preparePartContext(partId, context) {
        context = await super._preparePartContext(partId, context)

        context.tab = context.tabs[partId]

        switch (partId) {
            case "dot":
                return this._prepareDotContext(context)
            case "lifesteal":
                return this._prepareLifestealtContext(context)
            case "amplifier":
                return this._prepareAmplifiersContext(context)
        }

        return context;
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

        context.data = data

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
        data.damageTypes = [{label: 'All', value: 'all'}, ...CONFIG.WITCHER.damageTypes]

        context.data = data

        return context
    }

    _getTabs() {
        return this.constructor.TABS.reduce((tabs, { tab, condition, ...config }) => {
            if (!condition || condition(this.document)) tabs[tab] = {
                ...config,
                id: tab,
                group: "primary",
                active: this.tabGroups.primary === tab,
                cssClass: this.tabGroups.primary === tab ? "active" : ""
            };
            return tabs;
        }, {});
    }

}