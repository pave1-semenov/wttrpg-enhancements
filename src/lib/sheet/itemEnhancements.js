import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import DefauldDocumentSheet from "./defaultSheet.js"

export default class ItemEnhancementSheet extends LifeStealMixin((DefauldDocumentSheet)) {
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
            template: "modules/wttrpg-enhancements/templates/sheet/lifesteal.hbs",
            scrollable: [""]
        }
    }

    static TABS = {
        primary: {
            tabs: [
                { id: "lifesteal", icon: "fas fa-people-robbery" }
            ],
            initial: 'lifesteal',
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

    async _prepareContext(options) {
        let context = await super._prepareContext(options)

        this._prepareLifestealtContext(context)

        context.tabs = this._prepareTabs("primary")

        return context
    }
}