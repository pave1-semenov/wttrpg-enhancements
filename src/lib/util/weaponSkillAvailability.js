import { evaluateCondition } from './condition.js';

export function getCurrentTargetActor() {
    return Array.from(game.user?.targets ?? [])[0]?.actor ?? null;
}

export function isWeaponSkillAvailable(skill, actor, target) {
    return evaluateCondition(skill?.system?.condition ?? '', {
        attacker: actor,
        target
    });
}
