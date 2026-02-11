import { getInteractActor } from '/systems/TheWitcherTRPG/module/scripts/helper.js';
import { applyEnhancedDamage } from '../flows/applyDamageFlow.js';

export async function addEnhancedDamageContextOption(html, options) {
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
