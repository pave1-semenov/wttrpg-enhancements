import { SITUATIONAL_BONUS_SCOPES } from '../util/constants.js';
import { appendFormula, renderSituationalBonusCards, selectedBonusFormula } from '../util/situationalBonus.js';

const { DialogV2 } = foundry.applications.api;

async function withSkillBonusDialog(actor, source, callback) {
    const cards = await renderSituationalBonusCards(actor, [SITUATIONAL_BONUS_SCOPES.SKILL], { source });
    if (!cards) return callback();
    const originalPrompt = DialogV2.prompt.bind(DialogV2);
    DialogV2.prompt = function(config = {}) {
        const originalCallback = config.ok?.callback;
        return originalPrompt({
            ...config,
            content: `${config.content ?? ''}${cards}`,
            ok: {
                ...config.ok,
                callback: async (event, button, dialog) => {
                    const input = button.form.elements.customModifiers;
                    if (input) input.value = appendFormula(input.value, selectedBonusFormula(button.form, SITUATIONAL_BONUS_SCOPES.SKILL));
                    return originalCallback?.(event, button, dialog);
                }
            }
        });
    };
    try { return await callback(); } finally { DialogV2.prompt = originalPrompt; }
}

export function wrapSkillCheck(wrapped, skillMapEntry, threshold = -1) {
    return withSkillBonusDialog(this, skillMapEntry, () => wrapped(skillMapEntry, threshold));
}

export function wrapCustomSkillCheck(wrapped, event) {
    const source = this.items.find(item => item.id === event.currentTarget.closest('.item')?.dataset.itemId);
    return withSkillBonusDialog(this, source, () => wrapped(event));
}

export function wrapProfessionSkillCheck(wrapped, skill, options) {
    const source = {
        ...skill,
        situationalBonusIdentity: `profession:${skill?.skillName ?? ''}`
    };
    return withSkillBonusDialog(this, source, () => wrapped(skill, options));
}
