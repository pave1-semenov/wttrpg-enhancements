export function getCurrentCharacter() {
    return canvas.tokens.controlled[0]?.actor ?? game.user.character ?? null
}

function getAvailableOwnedActors() {
    return (game.actors?.filter(actor => actor.isOwner && actor.hasPlayerOwner) ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
}

async function promptForActor(actors) {
    const DialogV2 = foundry.applications.api.DialogV2
    const options = actors.map(actor => `<option value="${actor.id}">${actor.name}</option>`).join('')
    const values = await DialogV2.input({
        content: `<select name="actor">${options}</select>`
    })

    return values?.actor ? game.actors?.get(values.actor) ?? null : null
}

export async function getInteractActor() {
    const current = getCurrentCharacter()
    if (current) return current

    const availableActors = getAvailableOwnedActors()
    if (!availableActors.length) {
        ui.notifications.error(game.i18n.localize('WITCHER.Context.SelectActor'))
        return null
    }

    if (availableActors.length === 1) return availableActors[0]

    const selected = await promptForActor(availableActors)
    if (!selected) {
        ui.notifications.error(game.i18n.localize('WITCHER.Context.SelectActor'))
    }

    return selected
}
