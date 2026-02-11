import { TEMPLATE_PATHS } from "../util/constants.js";

export class EnhancementRoll extends Roll {
    static CHAT_TEMPLATE = TEMPLATE_PATHS.ROLL_ENHANCEMENT
    static TOOLTIP_TEMPLATE = TEMPLATE_PATHS.TOOLTIP_ENHANCEMENT

    async toMessage(messageData = {}, options = {}) {
        const messageOptions = foundry.utils.mergeObject({
            rollMode: game.settings.get('core', 'rollMode')
        }, options)

        return super.toMessage(messageData, messageOptions)
    }
}
