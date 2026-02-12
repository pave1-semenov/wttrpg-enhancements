import { ATTRIBUTES, FLAG_PATHS, TEMPLATE_PATHS } from '../util/constants.js';
import { ChatMessageData } from '../roll/chatMessageData.js';
import { EnhancementRoll } from '../roll/enhancementRoll.js';

export async function handleHot(actor, hot) {

    const hotFlags = foundry.utils.getProperty(hot, FLAG_PATHS.HOT);
    if (!hotFlags?.formula || !Roll.validate(hotFlags.formula)) return;

    const roll = await new EnhancementRoll(hotFlags.formula).evaluate()
    const healingAmount = await actor.calculateHealValue(roll.total)
    const { hpBefore, hpAfter } = await applyHotHealing(actor, healingAmount)
    const appliedHealing = Math.max(0, hpAfter - hpBefore)
    const hadBenefit = appliedHealing > 0

    const source = hot.origin ? await fromUuid(hot.origin) : null
    const healer = source?.actor ?? source ?? actor

    const content = await renderHotTemplate({
        hot,
        hotFlags,
        healer,
        target: actor,
        hpBefore,
        hpAfter,
        healingAmount: appliedHealing,
        hadBenefit
    });

    let messageData = new ChatMessageData(actor)
    messageData.flavor = content

    await roll.toMessage(messageData);
}

async function renderHotTemplate(data) {
    return renderTemplate(TEMPLATE_PATHS.CHAT_HOT_HEAL, {
        hot: data.hot,
        healer: data.healer,
        target: data.target,
        img: data.hot.img ?? 'icons/svg/heal.svg',
        hpBefore: data.hpBefore,
        hpAfter: data.hpAfter,
        healingAmount: data.healingAmount,
        hadBenefit: data.hadBenefit
    })
}

async function applyHotHealing(actor, healedFor) {
    const hpBefore = actor.system.derivedStats[ATTRIBUTES.HP].value
    if (healedFor > 0) {
        await actor.update({
            [`system.derivedStats.${ATTRIBUTES.HP}.value`]: actor.system.derivedStats[ATTRIBUTES.HP].value + healedFor
        })
    }
    const hpAfter = actor.system.derivedStats[ATTRIBUTES.HP].value

    return { hpBefore, hpAfter }
}
