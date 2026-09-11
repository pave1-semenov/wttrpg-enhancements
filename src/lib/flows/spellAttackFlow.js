import { SITUATIONAL_BONUS_SCOPES } from '../util/constants.js';
import { appendFormula, renderSituationalBonusCards, selectedBonusFormula } from '../util/situationalBonus.js';

const { DialogV2 } = foundry.applications.api;

export async function wrapCastSpell(wrapped, spellItem) {
    const cards = await renderSituationalBonusCards(
        this,
        [SITUATIONAL_BONUS_SCOPES.ATTACK, SITUATIONAL_BONUS_SCOPES.DAMAGE],
        { source: spellItem, target: Array.from(game.user?.targets ?? [])[0]?.actor ?? null }
    );
    if (!cards) return wrapped(spellItem);

    const originalPrompt = DialogV2.prompt.bind(DialogV2);
    const originalDamage = spellItem.system.damage;
    DialogV2.prompt = function(config = {}) {
        const originalCallback = config.ok?.callback;
        return originalPrompt({
            ...config,
            content: `${config.content ?? ''}${cards}`,
            ok: {
                ...config.ok,
                callback: async (event, button, dialog) => {
                    const result = await originalCallback?.(event, button, dialog);
                    if (!result) return result;
                    const attackBonus = selectedBonusFormula(button.form, SITUATIONAL_BONUS_SCOPES.ATTACK);
                    if (attackBonus) {
                        const roll = await new Roll(`0${attackBonus}`, spellItem.actor?.getRollData?.() ?? {}).evaluate();
                        result.customModifier = Number(result.customModifier || 0) + Number(roll.total || 0);
                    }
                    const damageBonus = selectedBonusFormula(button.form, SITUATIONAL_BONUS_SCOPES.DAMAGE);
                    if (damageBonus) spellItem.system.damage = appendFormula(originalDamage, damageBonus);
                    return result;
                }
            }
        });
    };

    try {
        return await wrapped(spellItem);
    } finally {
        DialogV2.prompt = originalPrompt;
        spellItem.system.damage = originalDamage;
    }
}
