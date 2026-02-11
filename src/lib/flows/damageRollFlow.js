import { getAmplifiedDamageFormula } from "../core/damageAmp.js";

export async function wrapDamageRoll(wrapped, damage) {
    const source = await fromUuid(damage.itemUuid)

    const originalFormula = damage.formula

    damage.formula = getAmplifiedDamageFormula(source.actor, damage)
    
    await wrapped(damage)

    damage.formula = originalFormula
}