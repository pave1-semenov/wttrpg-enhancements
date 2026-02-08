import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import DefaultTabbedDocumentSheet from "./defaultTabbedSheet.js"

export default class ItemEnhancementSheet extends LifeStealMixin((DefaultTabbedDocumentSheet)) {
    static DEFAULT_OPTIONS = {
        position: {
            width: 700,
            height: 700
        },
        form: {
            handler: ItemEnhancementSheet.saveData,
            submitOnChange: true,
            closeOnSubmit: false
        },
    }

    static PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
        },
        lifesteal: {
            container: { classes: ["tab-body"], id: "tabs" },
            template: "modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs",
            scrollable: [""]
        }
    }

    static TABS = [
        { tab: "lifesteal", label: game.i18n.localize('WTRPGEnhancements.Enhancements.Lifesteal'), icon: "fas fa-people-robbery" }
    ];

    tabGroups = {
        primary: "lifesteal"
    }

    /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
    static async saveData(event, form, formData) {
        const update = await this._prepareUpdateData(formData)

        await this.document.update(update)
    }

    async _prepareUpdateData(formData) {
        let updateData = {
            lifesteal: {}
        }

        const prefixesConfig = [
            { prefix: 'lifesteal.', target: updateData.lifesteal },
        ]

        return this._fillUpdateData(formData, updateData, prefixesConfig)
    }

    async _preparePartContext(partId, context) {
        context = await super._preparePartContext(partId, context)

        context.tab = context.tabs[partId]

        switch (partId) {
            case "lifesteal":
                return this._prepareLifestealtContext(context)
        }

        return context;
    }
}