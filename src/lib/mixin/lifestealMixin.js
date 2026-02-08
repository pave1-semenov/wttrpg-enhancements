export const LifeStealMixin = (Superclass) => class extends Superclass {
    async _prepareLifestealtContext(context) {
        const lifestealData = foundry.utils.getProperty(this.document, 'flags.wttrpg-enhancements.lifesteal')
        const data = lifestealData ? lifestealData : {
            enabled: false,
            lifestealStat: 'hp',
            flatPercentage: 100,
            variableFormula: '',
            storeOverheal: false,
            overhealPercentage: 100,
            overhealThreshold: 0
        }

        data.lifeStealStats = [
            { value: 'hp', label: game.i18n.localize('WITCHER.Actor.Hp') },
            { value: 'sta', label: game.i18n.localize('WITCHER.Actor.Stamina') },
        ]
        context.data = data

        return context
    }
}