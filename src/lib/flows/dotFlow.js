import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import { getAmplifiedDamageFormula } from '../core/damageAmp.js';
import { getDamageTypePresentation, getLocationPresentation } from '../util/presentation.js';
import { ATTRIBUTES, CHAT_FLAGS, FLAG_KEYS, FLAG_PATHS, MODULE, SYSTEM, TEMPLATE_PATHS } from '../util/constants.js';
import { importSystemModule } from '../util/systemImport.js';
import { EnhancementRoll } from '../roll/enhancementRoll.js';

export async function handleDot(actor, dot) {
    const { default: ChatMessageData } = await importSystemModule('module/chatMessage/ChatMessageData.js');
    const source = fromUuidSync(dot.origin)
    const flags = dot.flags[MODULE.FLAGS_KEY]
    const dotFlags = flags[FLAG_KEYS.DOT]

    const damage = await prepareDamageObject(source, actor, dotFlags)
    const spRoll = await handleSpDamage(dotFlags.damageProperties)
    damage.properties.spDamage = spRoll?.total

    const content = await renderDotDamageTemplate(dot, damage, spRoll)

    let messageData = new ChatMessageData(actor)
    messageData.flavor = content

    let roll = await new EnhancementRoll(damage.formula).evaluate()
    let message = await roll.toMessage(messageData);
    message.setFlag(SYSTEM.ID, CHAT_FLAGS.DAMAGE, damage)

    if (dotFlags.autoApply) {
        await applyDotDamage(source, actor, dotFlags, flags, roll, damage)
    }
}

async function handleSpDamage(dotProperties) {
    let spRoll = null
    if (dotProperties?.spDamage && Roll.validate(dotProperties.spDamage)) {
        spRoll = await (new Roll(`${dotProperties.spDamage}`).evaluate())
    }

    return spRoll
}

async function renderDotDamageTemplate(dot, damage, spRoll) {
    const locationKey = damage?.location?.value ?? foundry.utils.getProperty(dot, FLAG_PATHS.DOT)?.location
    const locationPresentation = getLocationPresentation(locationKey)
    const damageTypePresentation = getDamageTypePresentation(damage.type)
    const damageTypeLabel = getDamageTypeLabel(damage.type)

    return renderTemplate(TEMPLATE_PATHS.CHAT_DOT_DAMAGE, {
        name: dot.name,
        img: dot.img,
        damage: damage,
        locationPresentation: locationPresentation,
        damageTypePresentation: damageTypePresentation,
        damageTypeLabel: damageTypeLabel,
        spRollInline: spRoll?.toAnchor().outerHTML
    })
}

async function prepareDamageObject(source, actor, dotFlags) {
    let damage = {
        formula: dotFlags.formula,
        location: actor.getLocationObject(dotFlags.location),
        type: dotFlags.damageType,
        properties: {
            variableDamage: false,
            effects: []
        },
    };

    damage.formula = getAmplifiedDamageFormula(source.actor, damage)
    damage.properties = dotFlags?.damageProperties?.inherit ? source.system.damageProperties : dotFlags.damageProperties

    return damage
}

function getDamageTypeLabel(type) {
    const entry = CONFIG.WITCHER?.damageTypes?.find((damageType) => damageType.value === type)
    if (entry?.label) return game.i18n.localize(entry.label)
    return type
}

async function applyDotDamage(source, actor, dotFlags, flags, roll, damage) {
    const damageAttribute = dotFlags.nonLethal ? ATTRIBUTES.STA : ATTRIBUTES.HP
    const lifestealContext = initLifestealContext(source, actor, damageAttribute, flags[FLAG_KEYS.LIFESTEAL])
    const enemyData = {
        resistNonSilver: false,
        resistNonMeteorite: false,
        location: dotFlags.location,
        isVulnerable: false,
        addOilDmg: false,
        nonLethal: dotFlags.nonLethal
    }

    await actor.applyDamage(enemyData, Math.round(roll.total), damage, damageAttribute)

    if (flags[FLAG_KEYS.LIFESTEAL]?.enabled) {
        await applyLifesteal(lifestealContext)
    }
}
