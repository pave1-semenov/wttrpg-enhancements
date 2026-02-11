import ChatMessageData from '/systems/TheWitcherTRPG/module/chatMessage/ChatMessageData.js';
import { ATTRIBUTES, TEMPLATE_PATHS } from '../util/constants.js';
import { EnhancementRoll } from '../roll/enhancementRoll.js';

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
        const attributeBefore = attacker.system.derivedStats[stat].value;
        const lifestealAttribute = attacker.system.derivedStats[stat].value;
        const maxAttribute = attacker.system.derivedStats[stat].max;

        const currentShield = attacker.system.derivedStats[ATTRIBUTES.SHIELD].value || 0;
        const lifestealResult = computeLifestealResult({
            totalDamageDealt,
            lifestealPercent: flags.flatPercentage,
            lifestealAttribute,
            maxAttribute,
            storeOverheal: flags.storeOverheal,
            overhealPercent: flags.overhealPercentage,
            overhealThreshold: flags.overhealThreshold,
            currentShield,
            stat
        })

        const rollFlavor = game.i18n.format('WTTRPGEnhancements.Chat.Lifesteal.RollFlavor', {
            percent: flags.flatPercentage
        })
        let rollFormula = `${lifestealResult.flatLifesteal}[${rollFlavor}]`;
        const roll = await new EnhancementRoll(rollFormula).evaluate();

        await attacker.update({
            [`system.derivedStats.${stat}.value`]: lifestealResult.updatedAttribute,
        });

        if (flags.storeOverheal && stat === ATTRIBUTES.HP) {
            await attacker.update({
                [`system.derivedStats.${ATTRIBUTES.SHIELD}.value`]: lifestealResult.newShield
            });
        }


        const attributeLabel = getAttributeLabel(stat)

        const content = await renderTemplate(TEMPLATE_PATHS.CHAT_APPLY_LIFESTEAL, {
            source: source,
            actor: actor,
            attacker: attacker,
            lifesteal: lifestealResult.toHeal,
            overheal: lifestealResult.overheal,
            shieldValue: lifestealResult.newShield,
            effectiveHeal: lifestealResult.effectiveHeal,
            shieldGain: lifestealResult.shieldGain,
            hadBenefit: lifestealResult.hadBenefit,
            noBenefitReasonKey: lifestealResult.noBenefitReasonKey,
            storeOverheal: flags.storeOverheal,
            attributeBefore: attributeBefore,
            attributeAfter: lifestealResult.updatedAttribute,
            showAttributeChange: lifestealResult.effectiveHeal > 0,
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

        await roll.toMessage(messageData);
    }
}

function getAttributeLabel(stat) {
    switch (stat) {
        case ATTRIBUTES.HP:
            return game.i18n.localize('WTTRPGEnhancements.Stats.hp');
        case ATTRIBUTES.STA:
            return game.i18n.localize('WTTRPGEnhancements.Stats.sta');
        case ATTRIBUTES.SHIELD:
            return game.i18n.localize('WTTRPGEnhancements.Stats.shield');
        default:
            return game.i18n.localize('WTTRPGEnhancements.Stats.default');
    }
}

function computeLifestealResult({
    totalDamageDealt,
    lifestealPercent,
    lifestealAttribute,
    maxAttribute,
    storeOverheal,
    overhealPercent,
    overhealThreshold,
    currentShield,
    stat
}) {
    const flatLifesteal = Math.round(totalDamageDealt * (lifestealPercent / 100))
    const toHeal = flatLifesteal
    const afterLifesteal = lifestealAttribute + toHeal
    const updatedAttribute = Math.min(afterLifesteal, maxAttribute)
    const effectiveHeal = Math.max(0, updatedAttribute - lifestealAttribute)

    let overheal
    let newShield = 0
    let shieldGain = 0

    if (storeOverheal && stat === ATTRIBUTES.HP) {
        overheal = Math.round(Math.max(0, afterLifesteal - maxAttribute) * (overhealPercent / 100))
        const maxShield = currentShield + overheal
        newShield = overhealThreshold ? Math.min(maxShield, overhealThreshold) : maxShield
        shieldGain = Math.max(0, newShield - currentShield)
    }

    const hadBenefit = (effectiveHeal > 0) || (shieldGain > 0)
    const noBenefitReasonKey = hadBenefit ? null : getNoBenefitReasonKey({
        stat,
        lifestealAttribute,
        maxAttribute,
        storeOverheal,
        overhealThreshold,
        currentShield
    })

    return {
        flatLifesteal,
        toHeal,
        afterLifesteal,
        updatedAttribute,
        effectiveHeal,
        overheal,
        newShield,
        shieldGain,
        hadBenefit,
        noBenefitReasonKey
    }
}

function getNoBenefitReasonKey({
    stat,
    lifestealAttribute,
    maxAttribute,
    storeOverheal,
    overhealThreshold,
    currentShield
}) {
    const isAtAttributeCap = lifestealAttribute >= maxAttribute
    const isHp = stat === ATTRIBUTES.HP

    if (isHp && isAtAttributeCap && storeOverheal && overhealThreshold && currentShield >= overhealThreshold) {
        return 'WTTRPGEnhancements.Chat.Lifesteal.NoBenefitHpAndShieldCapped'
    }
    if (isHp && isAtAttributeCap && !storeOverheal) {
        return 'WTTRPGEnhancements.Chat.Lifesteal.NoBenefitHpCapped'
    }
    if (!isHp && isAtAttributeCap) {
        return 'WTTRPGEnhancements.Chat.Lifesteal.NoBenefitStatCapped'
    }

    return 'WTTRPGEnhancements.Chat.Lifesteal.NoBenefitGeneric'
}
