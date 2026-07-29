import { DamageInstance } from '/systems/TheWitcherTRPG/module/scripts/damageInstance.js';
import { getRollSourceItem } from '../util/weaponSkillAttachment.js';
import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import { getAttackLocationOptions } from '../util/location.js';
import { ATTRIBUTES, CHAT_FLAGS, FLAG_KEYS, MODULE, SYSTEM, TEMPLATE_PATHS } from '../util/constants.js';

const DialogV2 = foundry.applications.api.DialogV2;

export async function applyEnhancedDamage(actor, totalDamage, messageId) {
    let damage = game.messages.get(messageId).getFlag(SYSTEM.ID, CHAT_FLAGS.DAMAGE)
    let dialogData = await createApplyDamageDialog(actor, damage, totalDamage)
    const appliedDamage = getModifiedDamage(totalDamage, dialogData.damageModifierType, dialogData.damageModifier)

    damage.location = actor.getLocationObject(dialogData.location)

    if (dialogData.addOilDmg) {
        damage.properties.oilEffect = actor.system.category;
    }
    const attribute = dialogData?.nonLethal ? ATTRIBUTES.STA : ATTRIBUTES.HP

    const source = await fromUuid(damage.itemUuid)
    const rollSource = getRollSourceItem(source)
    const lifestealFlags = source?.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]
        ?? rollSource?.flags?.[MODULE.FLAGS_KEY]?.[FLAG_KEYS.LIFESTEAL]
    const lifestealContext = initLifestealContext(source, actor, attribute, lifestealFlags, damage)

    await actor.applyDamage(dialogData, [DamageInstance.create(appliedDamage).setType(damage.type)], damage, attribute)

    if (lifestealFlags?.enabled) {
        await applyLifesteal(lifestealContext)
    }
}

function getModifiedDamage(totalDamage, modifierType, modifier) {
    const baseDamage = Number(totalDamage)
    const numericModifier = Number(modifier)

    if (!Number.isFinite(baseDamage) || !Number.isFinite(numericModifier)) {
        return Math.max(0, Math.round(Number.isFinite(baseDamage) ? baseDamage : 0))
    }

    const modifiedDamage = modifierType === 'percentage'
        ? baseDamage * (1 + numericModifier / 100)
        : modifierType === 'fixed'
            ? baseDamage + numericModifier
            : baseDamage

    return Math.max(0, Math.round(modifiedDamage))
}

async function createApplyDamageDialog(actor, damage, totalDamage) {
    const isMonster = actor.type === 'monster'

    const content = await renderTemplate(TEMPLATE_PATHS.DIALOG_APPLY_DAMAGE, {
        damageType: `WITCHER.DamageType.${damage.type}`,
        location: damage.location.name,
        isMonster: isMonster,
        resistNonSilver: actor.system.resistantNonSilver,
        resistNonMeteorite: actor.system.resistantNonMeteorite,
        locations: getAttackLocationOptions(isMonster),
        totalDamage: Math.round(Number(totalDamage) || 0),
    })

    let {
        nonLethal,
        location,
        resistNonSilver,
        resistNonMeteorite,
        isVulnerable,
        addOilDmg,
        damageModifierType,
        damageModifier
    } =
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
                        addOilDmg: button.form.elements.oilDmg?.checked,
                        damageModifierType: button.form.elements.damageModifierType?.value,
                        damageModifier: button.form.elements.damageModifier?.value
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
        nonLethal,
        damageModifierType,
        damageModifier
    };
}



