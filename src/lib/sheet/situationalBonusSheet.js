import { bindConditionAutocomplete } from '../util/conditionAutocomplete.js';
import { SITUATIONAL_BONUS_SCOPES, TEMPLATE_PATHS } from '../util/constants.js';

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class SituationalBonusSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        position: { width: 620, height: 590 },
        window: { icon: 'fas fa-sparkles', title: 'WTTRPGEnhancements.SituationalBonus.SheetTitle' },
        form: { handler: SituationalBonusSheet.saveData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = { main: { template: TEMPLATE_PATHS.SHEET_SITUATIONAL_BONUS, scrollable: [''] } };

    static async saveData(event, form, formData) {
        const data = foundry.utils.expandObject(formData.object ?? {});
        await this.document.update({
            name: data.name ?? this.document.name,
            img: data.img ?? this.document.img,
            system: {
                description: data.system?.description ?? '',
                formula: data.system?.formula ?? '0',
                imageLayout: data.system?.imageLayout ?? 'left',
                scope: data.system?.scope ?? SITUATIONAL_BONUS_SCOPES.SKILL,
                applicableSkills: SituationalBonusSheet.normalizeArray(data.system?.applicableSkills),
                parentItemUuid: data.system?.parentItemUuid ?? this.document.system.parentItemUuid ?? '',
                condition: data.system?.condition ?? ''
            }
        });
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.item = this.document;
        context.scopes = Object.values(SITUATIONAL_BONUS_SCOPES).map(value => ({
            value,
            label: `WTTRPGEnhancements.SituationalBonus.Scope.${value}`
        }));
        context.imageLayouts = ['left', 'right', 'cover'].map(value => ({
            value,
            label: `WTTRPGEnhancements.SituationalBonus.ImageLayout.${value}`
        }));
        if (this.document.system.parentItemUuid) {
            context.scopes = context.scopes.filter(option => option.value !== SITUATIONAL_BONUS_SCOPES.SKILL);
        }
        const selectedSkills = new Set(this.document.system.applicableSkills ?? []);
        const standardSkills = Object.values(CONFIG.WITCHER?.skillMap ?? {}).map(skill => ({
            value: skill.name,
            label: game.i18n.localize(skill.label),
            checked: selectedSkills.has(skill.name),
            group: game.i18n.localize('WTTRPGEnhancements.SituationalBonus.StandardSkills')
        }));
        const customSkills = Array.from(this.document.actor?.items ?? [])
            .filter(item => item.type === 'skill')
            .map(skill => ({
                value: skill.uuid,
                label: skill.name,
                checked: selectedSkills.has(skill.uuid) || selectedSkills.has(skill.id),
                group: game.i18n.localize('WTTRPGEnhancements.SituationalBonus.CustomSkills')
            }));
        context.applicableSkills = [...standardSkills, ...customSkills]
            .sort((left, right) => left.group.localeCompare(right.group) || left.label.localeCompare(right.label));
        context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.document.system.description ?? ''
        );
        return context;
    }

    static normalizeArray(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
        return value ? [value] : [];
    }

    _onRender(context, options) {
        super._onRender(context, options);
        bindConditionAutocomplete(this.element);
    }
}
