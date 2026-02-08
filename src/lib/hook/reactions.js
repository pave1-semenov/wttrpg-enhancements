import { getInteractActor } from '/systems/TheWitcherTRPG/module/scripts/helper.js';

const DialogV2 = foundry.applications.api.DialogV2;

export async function addReactionOptionsContextMenu(html, options) {
    let canDefend = li => {
        return game.messages.get(li[0].dataset.messageId).system.defenseOptions;
    };

    options.push({
        name: `React`,
        icon: '<i class="fas fa-gear-alt"></i>',
        condition: canDefend,
        callback: async li => {
            promptReaction();
        }
    });

    return options;
}

async function promptReaction() {
    const actor = await getInteractActor()

    await DialogV2.prompt({
        window: { title: `ReactJS` },
        content: `Ola amigo`,
        ok: {
            callback: (event, button, dialog) => {
                ui.notifications.info(`You clicked OK!`);
            }
        }
    })
}