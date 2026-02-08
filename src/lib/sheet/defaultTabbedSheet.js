const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class DefaultTabbedDocumentSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
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

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        context.tabs = this._getTabs()

        return context;
    }

    async _fillUpdateData(formData, updateData, prefixes) {
        for (const [key, value] of Object.entries(formData.object)) {
            for (const { prefix, target } of prefixes) {
                if (key.startsWith(prefix)) {
                    const subKey = key.slice(prefix.length)
                    target[subKey] = value
                }
            }
        }

        return {
            flags: {
                'wttrpg-enhancements': {
                    ...updateData
                }
            }
        }
    }

}