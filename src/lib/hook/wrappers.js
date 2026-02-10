import ActiveEffectsEnhancementsSheet from '../sheet/activeEffectsEnhancements.js';
import ItemEnhancementSheet from '../sheet/itemEnhancements.js';
import { getInteractActor } from '/systems/TheWitcherTRPG/module/scripts/helper.js';
import { applyEnhancedDamage } from './damageHooks.js';

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

export function addItemButton(sheet, buttons) {
    const isWeapon = sheet.document?.type === "weapon"

    if (isWeapon && game.user.isGM) {
        buttons.splice(0, -1, {
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: '',
            onclick: async (event) => {
                await new ItemEnhancementSheet({
                    document: sheet.document,
                }).render(true)
            }
        });
    }

    return buttons
}

export async function wrapApplyDamageHooks(html, options) {
    let canApplyDamage = li => li.querySelector('.damage-message')

    options.push(
        {
            name: `${game.i18n.localize('WITCHER.Context.applyDmg')} (${game.i18n.localize('WTTRPGEnhancements.Misc.Enhanced')})`,
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApplyDamage,
            callback: async li => {
                await applyEnhancedDamage(
                    await getInteractActor(),
                    parseInt(li.querySelector('.dice-total').innerText),
                    li.dataset.messageId
                );
            }
        }
    )

    return options
}