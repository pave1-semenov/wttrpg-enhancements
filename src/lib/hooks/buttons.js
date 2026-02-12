import ActiveEffectsEnhancementsSheet from '../sheet/activeEffectsEnhancements.js';
import ItemEnhancementSheet from '../sheet/itemEnhancements.js';

export function addItemButton(sheet, buttons) {
    const isWeapon = sheet.document?.type === "weapon"

    if (isWeapon && game.user.isGM) {
        buttons.splice(0, -1, {
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: '',
            onclick: async () => {
                await new ItemEnhancementSheet({
                    document: sheet.document,
                }).render(true)
            }
        })
    }

    return buttons
}

export function addItemButtonAppV2(sheet, buttons) {
    const isSpell = sheet.document?.type === "spell"

    if (isSpell && game.user.isGM) {
        buttons.push({
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: 'WTTRPGEnhancements.Buttons.Title',
            onClick: async () => {
                await new ItemEnhancementSheet({
                    document: sheet.document,
                }).render(true)
            }
        })
    }

    return buttons
}


export function addActiveEffectEnhanceOption(sheet, buttons) {
    const isActiveEffectSheet = sheet.document?.documentName === "ActiveEffect"

    if (isActiveEffectSheet && game.user.isGM) {
        buttons.push({
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: 'WTTRPGEnhancements.Buttons.Title',
            onClick: async () => {
                await new ActiveEffectsEnhancementsSheet({
                    document: sheet.document,
                }).render(true)
            }
        });
    }

    return buttons
}
