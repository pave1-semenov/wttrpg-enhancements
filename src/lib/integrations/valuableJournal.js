import { MODULE } from '../util/constants.js';

const FLAG = 'valuableJournal';
const CARD_TEMPLATE = 'systems/TheWitcherTRPG/templates/chat/item/item-description.hbs';
const boundChatButtons = new WeakSet();
const localize = key => game.i18n.localize(`WTTRPGEnhancements.ValuableJournal.${key}`);

export function journalLink(item) {
    const attachment = item?.type === 'valuable' && item.getFlag(MODULE.ID, FLAG);
    if (!attachment?.uuid || !['JournalEntry', 'JournalEntryPage'].includes(attachment.type)) return '';
    const escape = foundry.utils.escapeHTML;
    return `<a class="content-link" draggable="true" data-link data-uuid="${escape(attachment.uuid)}" data-type="${attachment.type}"><i class="fas fa-book-open"></i> ${escape(attachment.name || localize('Label'))}</a>`;
}

export async function attachJournal(item, data) {
    if (item?.type !== 'valuable' || !item.isOwner) return false;
    if (!['JournalEntry', 'JournalEntryPage'].includes(data?.type) || !data.uuid) {
        ui.notifications.warn(localize('InvalidDrop'));
        return false;
    }
    const journal = await fromUuid(data.uuid);
    if (!journal || !['JournalEntry', 'JournalEntryPage'].includes(journal.documentName)) {
        ui.notifications.warn(localize('InvalidDrop'));
        return false;
    }
    await item.setFlag(MODULE.ID, FLAG, { uuid: journal.uuid, type: journal.documentName, name: journal.name });
    return true;
}

function reportError(error) {
    console.error(`${MODULE.ID} | Journal attachment`, error);
    ui.notifications.error(localize('SaveError'));
}

export function renderValuableJournal(app, html) {
    const root = html?.querySelector ? html : html?.[0];
    const item = app.document;
    if (!root || item?.documentName !== 'Item' || item.type !== 'valuable') return;
    const description = root.querySelector('textarea[name="system.description"]');
    if (!description) return;
    root.querySelectorAll('.wttrpg-journal-field').forEach(field => field.remove());
    const field = document.createElement('div');
    field.className = 'wttrpg-journal-field';
    const label = document.createElement('label');
    label.textContent = localize('Label');
    const zone = document.createElement('div');
    zone.className = 'wttrpg-journal-drop';
    zone.innerHTML = journalLink(item);
    if (!zone.innerHTML) zone.textContent = localize('Empty');
    field.append(label, zone);
    description.closest('.grid')?.after(field);
    if (!app.isEditable || !item.isOwner) return;
    zone.addEventListener('dragover', event => {
        event.preventDefault();
        event.stopPropagation();
        zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', async event => {
        event.preventDefault();
        event.stopPropagation();
        zone.classList.remove('dragover');
        try {
            const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
            await attachJournal(item, data);
        } catch (error) { reportError(error); }
    });
    if (!journalLink(item)) return;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'wttrpg-journal-remove';
    remove.title = localize('Remove');
    remove.setAttribute('aria-label', localize('Remove'));
    remove.innerHTML = '<i class="fas fa-unlink"></i>';
    remove.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        try { await item.unsetFlag(MODULE.ID, FLAG); }
        catch (error) { reportError(error); }
    });
    zone.append(remove);
}

export function renderActorJournals(app, html) {
    const root = html?.querySelector ? html : html?.[0];
    const actor = app.document;
    if (!root || actor?.documentName !== 'Actor') return;
    root.querySelectorAll('.wttrpg-inventory-journal').forEach(link => link.remove());
    for (const row of root.querySelectorAll('.item[data-item-id]')) {
        const item = actor.items.get(row.dataset.itemId);
        const link = journalLink(item);
        const chat = row.querySelector('.item-chat');
        if (chat && !boundChatButtons.has(chat)) {
            boundChatButtons.add(chat);
            // Capture before the system's listener; unattached items keep its normal action.
            chat.addEventListener('click', async event => {
                const currentItem = actor.items.get(row.dataset.itemId);
                if (!journalLink(currentItem)) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                try {
                    const content = await appendJournalToChat(
                        (...args) => foundry.applications.handlebars.renderTemplate(...args),
                        CARD_TEMPLATE, { item: currentItem, type: currentItem.type, config: CONFIG.WITCHER }
                    );
                    await ChatMessage.create({ content, speaker: ChatMessage.getSpeaker({ actor }),
                        style: CONST.CHAT_MESSAGE_STYLES.IC });
                } catch (error) {
                    console.error(`${MODULE.ID} | Journal chat card`, error);
                    ui.notifications.error(localize('ChatError'));
                }
            }, { capture: true });
        }
        const name = row.querySelector('.list-details > .item-display-info + div');
        if (!link || !name) continue;
        const container = document.createElement('div');
        container.className = 'wttrpg-inventory-journal';
        container.innerHTML = link;
        name.append(container);
    }
}

export async function appendJournalToChat(wrapped, template, data, ...args) {
    const content = await wrapped(template, data, ...args);
    if (template !== CARD_TEMPLATE) return content;
    const link = journalLink(data?.item);
    return link ? `${content}<div class="wttrpg-chat-journal">${link}</div>` : content;
}

export function registerValuableJournals() {
    Hooks.on('renderApplicationV2', renderValuableJournal);
    Hooks.on('renderApplicationV2', renderActorJournals);
}
