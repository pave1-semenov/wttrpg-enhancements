import { MODULE, SETTINGS } from '../util/constants.js';

function refreshArgonHud() {
    ui.ARGON?.refresh?.();
}

export function registerSettings() {
    game.settings.register(MODULE.ID, SETTINGS.ARGON_SHOW_BRAWLING_ACTIONS, {
        name: 'WTTRPGEnhancements.Settings.Argon.ShowBrawlingActions.Name',
        hint: 'WTTRPGEnhancements.Settings.Argon.ShowBrawlingActions.Hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshArgonHud
    });

    game.settings.register(MODULE.ID, SETTINGS.ARGON_SHOW_VERBAL_COMBAT, {
        name: 'WTTRPGEnhancements.Settings.Argon.ShowVerbalCombat.Name',
        hint: 'WTTRPGEnhancements.Settings.Argon.ShowVerbalCombat.Hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshArgonHud
    });

    game.settings.register(MODULE.ID, SETTINGS.ARGON_SHOW_SPECIAL_ATTACKS, {
        name: 'WTTRPGEnhancements.Settings.Argon.ShowSpecialAttacks.Name',
        hint: 'WTTRPGEnhancements.Settings.Argon.ShowSpecialAttacks.Hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshArgonHud
    });
}
