import { DOCUMENT_TYPES, ITEM_TYPES, TEMPLATE_PATHS } from '../util/constants.js';

const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class SituationalBonusManager extends HandlebarsApplicationMixin(DocumentSheetV2) {
    static DEFAULT_OPTIONS = {
        position: { width: 760, height: 700 },
        window: { icon: 'fas fa-sparkles', title: 'WTTRPGEnhancements.SituationalBonus.ManagerTitle', resizable: true },
        actions: {
            createBonus: SituationalBonusManager.createBonus,
            openBonus: SituationalBonusManager.openBonus,
            removeBonus: SituationalBonusManager.removeBonus
        }
    };

    static PARTS = { main: { template: TEMPLATE_PATHS.SHEET_SITUATIONAL_BONUS_MANAGER, scrollable: [''] } };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.document = this.document;
        context.bonuses = Array.from(this.document.items ?? [])
            .filter(item => item.type === ITEM_TYPES.SITUATIONAL_BONUS && !item.system?.parentItemUuid)
            .map(item => ({ id: item.id, name: item.name, img: item.img, scope: item.system.scope }));
        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const zone = this.element?.querySelector('[data-drop-zone]');
        zone?.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('dragover'); });
        zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone?.addEventListener('drop', async event => {
            event.preventDefault();
            zone.classList.remove('dragover');
            const data = TextEditor.getDragEventData(event);
            const source = data?.uuid ? await fromUuid(data.uuid) : null;
            if (source?.type !== ITEM_TYPES.SITUATIONAL_BONUS) {
                return ui.notifications.warn(game.i18n.localize('WTTRPGEnhancements.SituationalBonus.OnlyBonuses'));
            }
            const copy = source.toObject();
            delete copy._id;
            copy.system ??= {};
            copy.system.parentItemUuid = '';
            await this.document.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, [copy]);
            this.render(true);
        });
    }

    static async createBonus(event) {
        event.preventDefault();
        const [bonus] = await this.document.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, [{
            name: game.i18n.localize('WTTRPGEnhancements.SituationalBonus.NewBonus'),
            type: ITEM_TYPES.SITUATIONAL_BONUS,
            img: 'icons/svg/upgrade.svg',
            system: { formula: '1', imageLayout: 'left', scope: 'skill', condition: '', description: '' }
        }]);
        bonus?.sheet?.render(true);
        this.render(true);
    }

    static openBonus(event, element) {
        event.preventDefault();
        this.document.items.get(element.dataset.bonusId)?.sheet?.render(true);
    }

    static async removeBonus(event, element) {
        event.preventDefault();
        await this.document.deleteEmbeddedDocuments(DOCUMENT_TYPES.ITEM, [element.dataset.bonusId]);
        this.render(true);
    }
}
