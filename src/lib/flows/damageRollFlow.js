import { getAmplifiedDamageFormula } from "../core/damageAmp.js";

export async function wrapDamageRoll(wrapped, damage) {
    const resolvedSource = this ?? await fromUuid(damage.itemUuid);

    if (resolvedSource?.uuid) {
        damage.itemUuid = resolvedSource.uuid;
        damage.item = resolvedSource;
    }

    const originalFormula = damage.formula;

    if (resolvedSource?.actor) {
        damage.formula = getAmplifiedDamageFormula(resolvedSource.actor, damage);
    }

    await wrapped.call(resolvedSource ?? this, damage);

    damage.formula = originalFormula;
}
