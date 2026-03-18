import ItemEnhancementSheet from '../sheet/itemEnhancements.js';
import ActiveEffectsEnhancementsSheet from '../sheet/activeEffectsEnhancements.js';

export function addItemButtonAppV2(sheet, buttons) {
    const enhancaeble = ['spell', 'weapon'].includes(sheet.document?.type);

    if (enhancaeble && game.user.isGM) {
        buttons.push({
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: 'WTTRPGEnhancements.Buttons.Title',
            onClick: async () => {
                await new ItemEnhancementSheet({
                    document: sheet.document
                }).render(true);
            }
        });
    }

    return buttons;
}

export function addActiveEffectEnhanceOption(sheet, buttons) {
    const isActiveEffectSheet = sheet.document?.documentName === 'ActiveEffect';

    if (isActiveEffectSheet && game.user.isGM) {
        buttons.push({
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: 'WTTRPGEnhancements.Buttons.Title',
            onClick: async () => {
                await new ActiveEffectsEnhancementsSheet({
                    document: sheet.document
                }).render(true);
            }
        });
    }

    return buttons;
}
