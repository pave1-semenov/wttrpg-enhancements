import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import ChatMessageData from '/systems/TheWitcherTRPG/module/chatMessage/ChatMessageData.js';
import { getAmplifiedDamageFormula } from '../core/damageAmp.js';
import { getDamageTypePresentation, getLocationPresentation } from '../util/presentation.js';

export function registerCombatHooks() {
    Hooks.on('updateCombat', (combat, update, options, userId) => {
        combatHooks(combat, update, options, userId);
    });
}

function combatHooks(combat, update, options, userId) {
    handleDots(combat)
}

async function handleDots(combat) {
    if (!game.user.isGM) return;

    let actor = combat.combatants.get(combat.current.combatantId).actor;
    let dots = actor.effects
        .filter(effect => foundry.utils.getProperty(effect, 'flags.wttrpg-enhancements.dot.enabled') === true)

    for (const dot of dots) {
        await handleDot(actor, dot)
    }
}

async function handleDot(actor, dot) {
    const source = fromUuidSync(dot.origin)
    const flags = dot.flags['wttrpg-enhancements']
    const dotFlags = flags.dot

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
    let spRollInline

    if (dotFlags?.damageProperties?.inherit) {
        damage.properties = source.system.damageProperties
    } else {
        const dotProperties = dotFlags.damageProperties
        damage.properties = dotProperties
        console.log(dotProperties)
        if (dotProperties?.spDamage && Roll.validate(dotProperties.spDamage)) {
            const spRoll = await new Roll(`${dotProperties.spDamage}`).evaluate()
            damage.properties.spDamage = spRoll.total
            spRollInline = spRoll.toAnchor().outerHTML
        }
    }

    const locationKey = damage?.location?.value ?? dotFlags.location
    const locationPresentation = getLocationPresentation(locationKey)
    const damageTypePresentation = getDamageTypePresentation(damage.type)
    const damageTypeLabel = getDamageTypeLabel(damage.type)

    const content = await renderTemplate('modules/wttrpg-enhancements/templates/chat/dotDmg.hbs', {
        name: dot.name,
        img: dot.img,
        damage: damage,
        spRollInline: spRollInline,
        locationPresentation: locationPresentation,
        damageTypePresentation: damageTypePresentation,
        damageTypeLabel: damageTypeLabel
    });

    let messageData = new ChatMessageData(actor)
    messageData.flavor = content
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));

    let roll = await new Roll(damage.formula).evaluate()
    let message = await roll.toMessage(messageData);
    message.setFlag('TheWitcherTRPG', 'damage', damage)

    if (dotFlags.autoApply) {
        const damageAttribute = dotFlags.nonLethal ? 'sta' : 'hp'
        const lifestealContext = initLifestealContext(source, actor, damageAttribute, flags.lifesteal)
        const enemyData = {
            resistNonSilver: false,
            resistNonMeteorite: false,
            location: dotFlags.location,
            isVulnerable: false,
            addOilDmg: false,
            nonLethal: dotFlags.nonLethal
        }

        await actor.applyDamage(enemyData, Math.round(roll.total), damage, damageAttribute)

        if (flags.lifesteal?.enabled) {
            await applyLifesteal(lifestealContext)
        }
    }
}

function getDamageTypeLabel(type) {
    const entry = CONFIG.WITCHER?.damageTypes?.find((damageType) => damageType.value === type)
    if (entry?.label) return game.i18n.localize(entry.label)
    return type
}
