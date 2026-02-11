import { FLAG_PATHS } from '../util/constants.js';

export const LifeStealMixin = (Superclass) => class extends Superclass {
    async _prepareLifestealtContext(context) {
        const lifestealData = foundry.utils.getProperty(this.document, FLAG_PATHS.LIFESTEAL)
        const data = lifestealData ? lifestealData : {
            enabled: false,
            flatPercentage: 100,
            storeOverheal: false,
            overhealPercentage: 100,
            overhealThreshold: 0
        }

        if (!context.data) context.data = {}
        context.data.lifesteal = data

        return context
    }
}
