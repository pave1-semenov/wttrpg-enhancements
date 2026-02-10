import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import { getAttackLocationOptions } from '../util/location.js';

const DialogV2 = foundry.applications.api.DialogV2;

export async function applyEnhancedDamage(actor, totalDamage, messageId) {
    let damage = game.messages.get(messageId).getFlag('TheWitcherTRPG', 'damage')
    let dialogData = await createApplyDamageDialog(actor, damage)

    damage.location = actor.getLocationObject(dialogData.location)

    if (dialogData.addOilDmg) {
        damage.properties.oilEffect = actor.system.category;
    }
    const attribute = dialogData?.nonLethal ? 'sta' : 'hp'

    const source = await fromUuid(damage.itemUuid)
    const flags = source?.flags['wttrpg-enhancements']
    const lifestealContext = initLifestealContext(source, actor, attribute, flags?.lifesteal)

    await actor.applyDamage(dialogData, totalDamage, damage, attribute)

    if (flags?.lifesteal.enabled) {
        await applyLifesteal(lifestealContext)
    }
}

async function createApplyDamageDialog(actor, damage) {
    const isMonster = actor.type === 'monster'

    const content = await renderTemplate('modules/wttrpg-enhancements/templates/dialog/applyDamage.hbs', {
        damageType: `WITCHER.DamageType.${damage.type}`,
        location: damage.location.name,
        isMonster: isMonster,
        resistNonSilver: actor.system.resistantNonSilver,
        resistNonMeteorite: actor.system.resistantNonMeteorite,
        locations: getAttackLocationOptions(isMonster),
    })

    let { nonLethal, location, resistNonSilver, resistNonMeteorite, isVulnerable, addOilDmg } =
        await DialogV2.prompt({
            window: { title: `${game.i18n.localize('WITCHER.Context.applyDmg')}` },
            content: content,
            modal: true,
            ok: {
                callback: (event, button, dialog) => {
                    return {
                        nonLethal: button.form.elements.nonLethal?.checked,
                        location: button.form.elements.location?.value,
                        resistNonSilver: button.form.elements.resistNonSilver?.checked,
                        resistNonMeteorite: button.form.elements.resistNonMeteorite?.checked,
                        isVulnerable: button.form.elements.vulnerable?.checked,
                        addOilDmg: button.form.elements.oilDmg?.checked
                    };
                }
            }
        });

    return {
        resistNonSilver,
        resistNonMeteorite,
        location,
        isVulnerable,
        addOilDmg,
        nonLethal
    };
}