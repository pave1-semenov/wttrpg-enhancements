const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class ActorReactionsSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
    static DEFAULT_OPTIONS = {
        position: {
            width: 700,
            height: 700
        },
        form: {
            handler: ActorReactionsSheet.saveData,
            submitOnChange: true,
            closeOnSubmit: false
        },
    }

    static PARTS = {
        form: {
            template: "modules/wttrpg-enhancements/templates/sheet/reactions-list.hbs",
            scrollable: [""]
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
        console.log(event, form, formData)
    }

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        context.reactions = this.document.itemTypes["wttrpg-enhancements.reaction"]

        return context;
    }
}