const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class DefauldDocumentSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
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