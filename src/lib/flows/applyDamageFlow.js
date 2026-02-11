import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import { getAttackLocationOptions } from '../util/location.js';
import { ATTRIBUTES, CHAT_FLAGS, FLAG_KEYS, MODULE, SYSTEM, TEMPLATE_PATHS } from '../util/constants.js';

const DialogV2 = foundry.applications.api.DialogV2;

export async function applyEnhancedDamage(actor, totalDamage, messageId) {
    let damage = game.messages.get(messageId).getFlag(SYSTEM.ID, CHAT_FLAGS.DAMAGE)
    let dialogData = await createApplyDamageDialog(actor, damage)

    damage.location = actor.getLocationObject(dialogData.location)

    if (dialogData.addOilDmg) {
        damage.properties.oilEffect = actor.system.category;
    }
    const attribute = dialogData?.nonLethal ? ATTRIBUTES.STA : ATTRIBUTES.HP

    const source = await fromUuid(damage.itemUuid)
    const flags = source?.flags[MODULE.FLAGS_KEY]
    const lifestealContext = initLifestealContext(source, actor, attribute, flags?.[FLAG_KEYS.LIFESTEAL])

    await actor.applyDamage(dialogData, totalDamage, damage, attribute)

    if (flags?.[FLAG_KEYS.LIFESTEAL]?.enabled) {
        await applyLifesteal(lifestealContext)
    }
}

async function createApplyDamageDialog(actor, damage) {
    const isMonster = actor.type === 'monster'

    const content = await renderTemplate(TEMPLATE_PATHS.DIALOG_APPLY_DAMAGE, {
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
