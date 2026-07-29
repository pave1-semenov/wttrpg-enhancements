import { FLAG_PATHS, LIFESTEAL_ATTRIBUTES } from '../util/constants.js';

export const LifeStealMixin = (Superclass) => class extends Superclass {
    async _prepareLifestealtContext(context) {
        const lifestealData = foundry.utils.getProperty(this.document, FLAG_PATHS.LIFESTEAL)
        const data = {
            enabled: false,
            flatPercentage: 100,
            attribute: LIFESTEAL_ATTRIBUTES.DEFAULT,
            storeOverheal: false,
            overhealPercentage: 100,
            overhealThreshold: 0,
            condition: '',
            ...lifestealData
        }
        data.attributeOptions = [
            { value: LIFESTEAL_ATTRIBUTES.DEFAULT, label: 'WTTRPGEnhancements.Sheet.Lifesteal.AttributeDefault' },
            { value: LIFESTEAL_ATTRIBUTES.HP, label: 'WTTRPGEnhancements.Stats.hp' },
            { value: LIFESTEAL_ATTRIBUTES.STA, label: 'WTTRPGEnhancements.Stats.sta' }
        ]

        if (!context.data) context.data = {}
        context.data.lifesteal = data

        return context
    }
}
