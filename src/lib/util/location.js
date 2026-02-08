const LOCATIONS = {
    DEFAULT: [
        { value: 'head', label: 'WITCHER.Dialog.attackHead' },
        { value: 'torso', label: 'WITCHER.Dialog.attackTorso' },
        { value: 'leftArm', label: 'WITCHER.Dialog.attackLArm' },
        { value: 'rightArm', label: 'WITCHER.Dialog.attackRArm' },
        { value: 'leftLeg', label: 'WITCHER.Dialog.attackLLeg' },
        { value: 'rightLeg', label: 'WITCHER.Dialog.attackRLeg' }
    ],
    RANDOM_HUMAN: { value: 'randomHuman', label: 'WITCHER.Dialog.attackRandomHuman' },
    RANDOM_MONSTER: { value: 'randomMonster', label: 'WITCHER.Dialog.attackRandomMonster' },
    TAIL_WING: { value: 'tailWing', label: 'WITCHER.Dialog.attackTail' },
}

export function getAttackLocationOptions(isMonster) {
    let options = []
    if (isMonster) {
        options.push(LOCATIONS.RANDOM_MONSTER)
        options.push(LOCATIONS.TAIL_WING)
    } else {
        options.push(LOCATIONS.RANDOM_HUMAN)
    }

    return options.concat(LOCATIONS.DEFAULT)
}


export function getAllLocationOptions() {
    return [
        LOCATIONS.RANDOM_HUMAN,
        LOCATIONS.RANDOM_MONSTER,
        ...LOCATIONS.DEFAULT,
        LOCATIONS.TAIL_WING
    ]
}