const DAMAGE_TYPE_PRESENTATION = {
    bludgeoning: { icon: 'fas fa-hammer', color: '#9aa3ad' },
    slashing: { icon: 'fas fa-scissors', color: '#d4d4d8' },
    piercing: { icon: 'fas fa-crosshairs', color: '#cbd5f5' },
    elemental: { icon: 'fas fa-atom', color: '#7dd3fc' },
    electricity: { icon: 'fas fa-bolt', color: '#fbbf24' },
    fire: { icon: 'fas fa-fire', color: '#f97316' },
    ice: { icon: 'fas fa-snowflake', color: '#60a5fa' },
};

const LOCATION_PRESENTATION = {
    head: { icon: 'fas fa-skull' },
    torso: { icon: 'fas fa-user' },
    leftArm: { icon: 'fas fa-hand' },
    rightArm: { icon: 'fas fa-hand' },
    leftLeg: { icon: 'fas fa-shoe-prints' },
    rightLeg: { icon: 'fas fa-shoe-prints' }
};

const DEFAULT_DAMAGE_PRESENTATION = { icon: 'fas fa-bolt', color: '#cbd5f5' };
const DEFAULT_LOCATION_PRESENTATION = { icon: 'fas fa-location-dot' };

export function getDamageTypePresentation(type) {
    if (!type) return DEFAULT_DAMAGE_PRESENTATION;
    return DAMAGE_TYPE_PRESENTATION[type] ?? DEFAULT_DAMAGE_PRESENTATION;
}

export function getLocationPresentation(locationValue) {
    if (!locationValue) return DEFAULT_LOCATION_PRESENTATION;
    return LOCATION_PRESENTATION[locationValue] ?? DEFAULT_LOCATION_PRESENTATION;
}
