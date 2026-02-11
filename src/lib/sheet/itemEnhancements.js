import { LifeStealMixin } from "../mixin/lifestealMixin.js"
import { FORM_PREFIXES, ENHANCEMENT_KEYS, TEMPLATE_PATHS } from "../util/constants.js";
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
            template: TEMPLATE_PATHS.NAVIGATION,
        },
        [ENHANCEMENT_KEYS.LIFESTEAL]: {
            template: TEMPLATE_PATHS.SHEET_LIFESTEAL,
            scrollable: [""]
        }
    }

    static TABS = {
        primary: {
            tabs: [
                { id: ENHANCEMENT_KEYS.LIFESTEAL, icon: "fas fa-people-robbery" }
            ],
            initial: ENHANCEMENT_KEYS.LIFESTEAL,
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
            [ENHANCEMENT_KEYS.LIFESTEAL]: {}
        }

        const prefixesConfig = [
            { prefix: FORM_PREFIXES.LIFESTEAL, target: updateData[ENHANCEMENT_KEYS.LIFESTEAL] },
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
