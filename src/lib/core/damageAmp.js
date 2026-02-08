export async function wrapDamageRoll(wrapped, damage) {
    const source = await fromUuid(damage.itemUuid)
    const effects = source.actor.appliedEffects
    const originalFormula = damage.formula
    let formula = originalFormula
    const displayRollDetails = game.settings.get('TheWitcherTRPG', 'displayRollsDetails')

    const amplifiers = effects.filter(e => {
        const flags = e.flags['wttrpg-enhancements']?.amp
        const damageType = flags?.damageType
        return flags?.enabled && (damageType === damage.type || damageType === 'all')
    }).map(e => [e.name, e.flags['wttrpg-enhancements'].amp])

    amplifiers.filter(([name, amp]) => amp.variableFormula).forEach(([name, amp]) => {
        formula += displayRollDetails ? `+${amp.variableFormula}[${name}]` : `+${amp.variableFormula}`
    })
    amplifiers.filter(([name, amp]) => amp.multiplier).forEach(([name, amp]) => {
        const modifier = displayRollDetails ? `${amp.multiplier}[${name}]` : `${amp.multiplier}`
        formula = `(${formula}) * ${modifier}`
    })

    damage.formula = formula
    await wrapped(damage)

    damage.formula = originalFormula
}