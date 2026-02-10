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

    if (totalDamageDealt > 0) {
        const lifestealAttribute = attacker.system.derivedStats[stat].value;
        const maxAttribute = attacker.system.derivedStats[stat].max;

        const flatLifesteal = Math.round(totalDamageDealt * (flags.flatPercentage / 100))
        const rollFlavor = game.i18n.format('WTTRPGEnhancements.Chat.Lifesteal.RollFlavor', {
            percent: flags.flatPercentage
        })
        let rollFormula = `${flatLifesteal}[${rollFlavor}]`;

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
            const maxShield = currentShield + overheal
            newShield = flags.overhealThreshold ? Math.min(maxShield, flags.overhealThreshold) : maxShield;

            await attacker.update({
                'system.derivedStats.shield.value': newShield
            });

        }


        const attributeLabel = getAttributeLabel(stat)

        const content = await renderTemplate('modules/wttrpg-enhancements/templates/chat/applyLifesteal.hbs', {
            source: source,
            actor: actor,
            attacker: attacker,
            lifesteal: toHeal,
            overheal: overheal,
            shieldValue: newShield,
            attribute: stat,
            attributeLabel: attributeLabel,
            totalDamageDealt: totalDamageDealt,
            lifestealPercent: flags.flatPercentage,
            overhealPercent: flags.overhealPercentage,
            statBeforeDmg: statBeforeDmg,
            statAfterDmg: attributeAfter
        });

        let messageData = new ChatMessageData(attacker)
        messageData.flavor = content
        ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));

        await roll.toMessage(messageData);
    }
}

function getAttributeLabel(stat) {
    switch (stat) {
        case 'hp':
            return game.i18n.localize('WTTRPGEnhancements.Stats.hp');
        case 'sta':
            return game.i18n.localize('WTTRPGEnhancements.Stats.sta');
        case 'shield':
            return game.i18n.localize('WTTRPGEnhancements.Stats.shield');
        default:
            return game.i18n.localize('WTTRPGEnhancements.Stats.default');
    }
}

