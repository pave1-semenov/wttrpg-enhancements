const TEMPORARY_SP_BONUS_PROPERTY = 'wttrpgEnhancementsTemporarySpBonus';

export function applyTemporarySpBonus(damage, amount) {
    const bonus = normalizeTemporarySpBonus(amount);

    damage.properties ??= {};
    delete damage.properties[TEMPORARY_SP_BONUS_PROPERTY];

    if (bonus === 0 || !damage.location?.name) return;

    damage.properties[TEMPORARY_SP_BONUS_PROPERTY] = {
        amount: bonus,
        location: damage.location.name
    };
}

export function wrapGetLocationArmor(wrapped, location, properties = {}) {
    const locationArmor = wrapped(location, properties);
    const temporarySpBonus = properties?.[TEMPORARY_SP_BONUS_PROPERTY];
    const bonus = normalizeTemporarySpBonus(temporarySpBonus?.amount);

    if (
        !locationArmor
        || bonus === 0
        || !temporarySpBonus?.location
        || temporarySpBonus.location !== location?.name
    ) {
        return locationArmor;
    }

    const totalSP = Number(locationArmor.totalSP) || 0;
    const displaySP = `${locationArmor.displaySP ?? totalSP}`.trim() || `${totalSP}`;

    return {
        ...locationArmor,
        totalSP: totalSP + bonus,
        displaySP: `${displaySP} + ${bonus}`
    };
}

function normalizeTemporarySpBonus(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.floor(numericValue));
}
