import { MODULE } from '../util/constants.js';

const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class DefauldDocumentSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
    async _fillUpdateData(formData, updateData, prefixes) {
        for (const [key, value] of Object.entries(formData.object)) {
            for (const { prefix, target } of prefixes) {
                const normalizedPrefix = this._normalizePrefix(prefix)
                if (key.startsWith(normalizedPrefix)) {
                    const subKey = key.slice(normalizedPrefix.length)
                    target[subKey] = value
                }
            }
        }

        return {
            flags: {
                [MODULE.FLAGS_KEY]: {
                    ...updateData
                }
            }
        }
    }

    _normalizePrefix(prefix) {
        return prefix.endsWith('.') ? prefix : `${prefix}.`
    }

}
