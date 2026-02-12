import { applyEnhancedDamage } from '../flows/applyDamageFlow.js';
import { importSystemModule } from '../util/systemImport.js';

export async function addEnhancedDamageContextOption(html, options) {
    let canApplyDamage = li => li.querySelector('.damage-message')

    options.push(
        {
            name: `${game.i18n.localize('WITCHER.Context.applyDmg')} (${game.i18n.localize('WTTRPGEnhancements.Misc.Enhanced')})`,
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApplyDamage,
            callback: async li => {
                const { getInteractActor } = await importSystemModule('module/scripts/helper.js');
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
