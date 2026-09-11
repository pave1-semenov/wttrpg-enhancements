import { DOCUMENT_TYPES, ITEM_TYPES } from '../util/constants.js';

export function getAttachedItemSituationalBonuses(item) {
    const collections = [item?.actor?.items, game.items].filter(Boolean);
    return collections.flatMap(collection => Array.from(collection)).filter(entry =>
        entry.type === ITEM_TYPES.SITUATIONAL_BONUS && entry.system?.parentItemUuid === item?.uuid
    );
}

export async function cloneAttachedSituationalBonusesToActor(sourceItem, targetActor, targetItem) {
    const bonuses = getAttachedItemSituationalBonuses(sourceItem);
    if (!bonuses.length) return [];
    const data = bonuses.map(bonus => {
        const copy = bonus.toObject();
        delete copy._id;
        copy.system.parentItemUuid = targetItem.uuid;
        return copy;
    });
    return targetActor.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, data);
}

export const ItemSituationalBonusMixin = Superclass => class extends Superclass {
    getAttachedSituationalBonuses() {
        return getAttachedItemSituationalBonuses(this.document);
    }

    async createAttachedSituationalBonus(source = null) {
        const data = source?.toObject?.() ?? {
            name: game.i18n.localize('WTTRPGEnhancements.SituationalBonus.NewBonus'),
            type: ITEM_TYPES.SITUATIONAL_BONUS,
            img: 'icons/svg/upgrade.svg',
            system: { formula: '1', imageLayout: 'left', scope: 'attack', condition: '', description: '' }
        };
        delete data._id;
        data.system ??= {};
        data.system.parentItemUuid = this.document.uuid;
        if (data.system.scope === 'skill') data.system.scope = 'attack';

        let created;
        if (this.document.actor) {
            [created] = await this.document.actor.createEmbeddedDocuments(DOCUMENT_TYPES.ITEM, [data]);
        } else if (this.document.pack) {
            created = await Item.create(data, { pack: this.document.pack });
        } else {
            created = await Item.create(data);
        }
        this.render(true);
        return created;
    }

    async onDropSituationalBonus(event) {
        const dragData = TextEditor.getDragEventData(event);
        const source = dragData?.uuid ? await fromUuid(dragData.uuid) : null;
        if (source?.type !== ITEM_TYPES.SITUATIONAL_BONUS) {
            return ui.notifications.warn(game.i18n.localize('WTTRPGEnhancements.SituationalBonus.OnlyBonuses'));
        }
        await this.createAttachedSituationalBonus(source);
    }

    static async onCreateSituationalBonus(event) {
        event.preventDefault();
        const bonus = await this.createAttachedSituationalBonus();
        bonus?.sheet?.render(true);
    }

    static onOpenSituationalBonus(event, element) {
        event.preventDefault();
        const bonus = this.getAttachedSituationalBonuses().find(item => item.id === element.dataset.bonusId);
        bonus?.sheet?.render(true);
    }

    static async onRemoveSituationalBonus(event, element) {
        event.preventDefault();
        const bonus = this.getAttachedSituationalBonuses().find(item => item.id === element.dataset.bonusId);
        await bonus?.delete();
        this.render(true);
    }
};
