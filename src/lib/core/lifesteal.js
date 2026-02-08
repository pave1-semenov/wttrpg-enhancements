import ChatMessageData from '/systems/TheWitcherTRPG/module/chatMessage/ChatMessageData.js';

export function initLifestealContext(source, actor, stat, flags) {
    return {
        flags: flags,
        attacker: source.actor,
        source: source,
        actor: actor,
        stat: stat,
        statBeforeDmg: actor.system.derivedStats[stat].value,
    }
}

export async function applyLifesteal(context) {
    const { actor, source, attacker, stat, statBeforeDmg, flags } = context;

    if (!flags?.enabled) return;

    const attributeAfter = actor.system.derivedStats[stat].value;
    const totalDamageDealt = statBeforeDmg - attributeAfter;

    const lifestealAttribute = attacker.system.derivedStats[stat].value;
    const maxAttribute = attacker.system.derivedStats[stat].max;

    const flatLifesteal = Math.round(totalDamageDealt * (flags.flatPercentage / 100))
    let rollFormula = `${flatLifesteal}[Flat lifesteal (${flags.flatPercentage}%)]`;

    if (flags.variableFormula && Roll.validate(flags.variableFormula)) {
        rollFormula += ` + ${flags.variableFormula}[Variable lifesteal]`;
    }
    const roll = await new Roll(rollFormula).evaluate();

    const toHeal = roll.total;
    const afterLifesteal = lifestealAttribute + toHeal;

    await attacker.update({
        [`system.derivedStats.${stat}.value`]: Math.min(afterLifesteal, maxAttribute),
    });

    let overheal, newShield = 0

    if (flags.storeOverheal && stat === 'hp') {
        overheal = Math.round(Math.max(0, afterLifesteal - maxAttribute) * (flags.overhealPercentage / 100));
        const currentShield = attacker.system.derivedStats.shield.value || 0;
        newShield = Math.min(currentShield + overheal, flags.overhealThreshold);

        await attacker.update({
            'system.derivedStats.shield.value': newShield
        });

    }

    
    const content = await renderTemplate('modules/wttrpg-enhancements/templates/chat/applyLifesteal.hbs', {
        source: source,
        actor: actor,
        attacker: attacker,
        lifesteal: toHeal,
        overheal: overheal,
        shieldValue: newShield,
        attribute: stat
    });

    let messageData = new ChatMessageData(attacker)
    messageData.flavor = content
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));

    await roll.toMessage(messageData);
}

