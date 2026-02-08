import ActiveEffectsEnhancementsSheet from '../sheet/activeEffectsEnhancements.js';
import ActorReactionsSheet from '../sheet/actorReactionsSheet.js';
import ItemEnhancementSheet from '../sheet/itemEnhancements.js';
import { getInteractActor } from '/systems/TheWitcherTRPG/module/scripts/helper.js';
import applyEnhancedDamage from './damageHooks.js';

export function addActiveEffectEnhanceOption(wrapped) {
    const buttons = wrapped();

    if (game.user.isGM) {
        const index = findCloseButtonIndex(buttons);

        buttons.splice(index, 0, {
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: '',
            onclick: async (event) => {
                await new ActiveEffectsEnhancementsSheet({
                    document: this.object,
                }).render(true)
            }
        });
    }

    return buttons;
}

function findCloseButtonIndex(buttons) {
    const closeButton = buttons.find(button => button.class === 'close')

    return buttons.indexOf(closeButton)
}

export function addItemButton(wrapped) {
    const buttons = wrapped();

    if (game.user.isGM) {
        const index = findCloseButtonIndex(buttons);

        buttons.splice(index, 0, {
            class: 'enhancement',
            icon: 'fas fa-circle-up',
            label: '',
            onclick: async (event) => {
                await new ItemEnhancementSheet({
                    document: this.object,
                }).render(true)
            }
        });
    }

    return buttons;
}

export function addReactionsList(wrapped) {
    const buttons = wrapped();

    buttons.push({
        class: 'enhancement',
        icon: 'fas fa-plus',
        label: 'R',
        onclick: async (event) => {
            await new ActorReactionsSheet({
                document: this.actor,
            }).render(true)
        }
    })


    return buttons;
}

export async function wrapApplyDamageHooks(html, options) {
    let canApplyDamage = li => li.find('.damage-message').length

    options.push(
        {
            name: `${game.i18n.localize('WITCHER.Context.applyDmg')} (${game.i18n.localize('WTRPGEnhancements.Misc.Enhanced')})`,
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApplyDamage,
            callback: async li => {
                await applyEnhancedDamage(
                    await getInteractActor(),
                    parseInt(li.find('.dice-total')[0].innerText),
                    li[0].dataset.messageId
                );
            }
        }
    )

    return options;
}