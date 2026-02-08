import { applyLifesteal, initLifestealContext } from '../core/lifesteal.js';
import ChatMessageData from '/systems/TheWitcherTRPG/module/chatMessage/ChatMessageData.js';
import { applyDamage } from '/systems/TheWitcherTRPG/module/scripts/combat/applyDamage.js';

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

    if (dotFlags?.damageProperties?.inherit) {
        damage.properties = source.system.damageProperties
    } else {
        const dotProperties = dotFlags.damageProperties
        damage.properties = dotProperties
        if (dotProperties?.spDamage && Roll.validate(dotProperties.spDamage)) {
            //To DO display the SP damage in the chat message
            damage.properties.spDamage = (await new Roll(dotProperties.spDamage).evaluate()).total
        }
    }

    const content = await renderTemplate('modules/wttrpg-enhancements/templates/chat/dotDmg.hbs', {
        name: dot.name,
        img: dot.img,
        damage: damage
    });

    let messageData = new ChatMessageData(actor)
    messageData.flavor = content
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    
    let roll = await new Roll(damage.formula).evaluate()
    let message = await roll.toMessage(messageData);
    message.setFlag('TheWitcherTRPG', 'damage', damage)

    if (dotFlags.autoApply) {
        const damageAttribute = damage.properties.isNonLethal ? 'sta' : 'hp'
        const lifestealContext = initLifestealContext(source, actor, damageAttribute, flags.lifesteal)

        await applyDamage(actor, {}, roll.total, damage, damageAttribute)

        if (flags.lifesteal?.enabled) {
            await applyLifesteal(lifestealContext)
        }
    }
} 