import { FLAG_KEYS, MODULE } from '../util/constants.js';

export function getAmplifiedDamageFormula(actor, damage) {
    const effects = actor?.appliedEffects ?? []
    const displayRollDetails = game.settings.get('TheWitcherTRPG', 'displayRollsDetails')

    let formula = damage.formula

    const amplifiers = effects.filter(e => {
        const flags = e.flags[MODULE.FLAGS_KEY]?.[FLAG_KEYS.AMP]
        const damageType = flags?.damageType
        return flags?.enabled && (damageType === damage.type || damageType === 'all')
    }).map(e => [e.name, e.flags[MODULE.FLAGS_KEY][FLAG_KEYS.AMP]])

    amplifiers.filter(([name, amp]) => amp.variableFormula).forEach(([name, amp]) => {
        formula += displayRollDetails ? `+${amp.variableFormula}[${name}]` : `+${amp.variableFormula}`
    })
    let variableAmplifiersApplied = false
    amplifiers.filter(([name, amp]) => amp.multiplier).forEach(([name, amp]) => {
        const modifier = displayRollDetails ? `${amp.multiplier}[${name}]` : `${amp.multiplier}`
        formula = `(${formula}) * ${modifier}`
        variableAmplifiersApplied = true
    })
    if (variableAmplifiersApplied) {
        formula = `round(${formula})`
    }

    return formula
}
