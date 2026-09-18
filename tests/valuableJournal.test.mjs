import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (await readFile(new URL('../src/lib/integrations/valuableJournal.js', import.meta.url), 'utf8'))
    .replace("import { MODULE } from '../util/constants.js';", "const MODULE = { ID: 'wttrpg-enhancements' };");
const { attachJournal, journalLink, appendJournalToChat, renderValuableJournal } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
globalThis.game = { i18n: { localize: key => key } };
globalThis.foundry = { utils: { escapeHTML: value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') } };
globalThis.ui = { notifications: { warn() {} } };

function valuable() {
    return {
        type: 'valuable', documentName: 'Item', isOwner: true, attachment: null,
        getFlag() { return this.attachment; },
        async setFlag(scope, key, value) {
            assert.equal(scope, 'wttrpg-enhancements');
            assert.equal(key, 'valuableJournal');
            this.attachment = value;
        }
    };
}

test('entry and page drops preserve the exact target UUID and replace the attachment', async () => {
    const item = valuable();
    for (const type of ['JournalEntry', 'JournalEntryPage']) {
        const uuid = type === 'JournalEntry' ? 'JournalEntry.entry' : 'JournalEntry.entry.JournalEntryPage.page';
        globalThis.fromUuid = async () => ({ documentName: type, uuid, name: 'Clue' });
        assert.equal(await attachJournal(item, { type, uuid }), true);
        assert.deepEqual(item.attachment, { type, uuid, name: 'Clue' });
    }
});

test('invalid and unresolved drops preserve the existing attachment', async () => {
    const item = valuable();
    const existing = item.attachment = { uuid: 'JournalEntry.old', type: 'JournalEntry', name: 'Old' };
    for (const resolved of [null, { documentName: 'Actor' }]) {
        globalThis.fromUuid = async () => resolved;
        assert.equal(await attachJournal(item, { type: 'JournalEntry', uuid: 'JournalEntry.missing' }), false);
        assert.equal(item.attachment, existing);
    }
    for (const data of [null, {}, { type: 'Actor', uuid: 'Actor.id' }, { type: 'JournalEntryPage' }]) {
        assert.equal(await attachJournal(item, data), false);
        assert.equal(item.attachment, existing);
    }
});

test('non-owned items and other item types cannot receive attachments', async () => {
    for (const overrides of [{ isOwner: false }, { type: 'weapon' }]) {
        const item = Object.assign(valuable(), overrides);
        assert.equal(await attachJournal(item, { type: 'JournalEntry', uuid: 'JournalEntry.id' }), false);
        assert.equal(item.attachment, null);
    }
});

test('native journal links escape names and UUID attributes', () => {
    const item = valuable();
    item.attachment = { uuid: 'JournalEntry."unsafe', type: 'JournalEntry', name: '<img src=x onerror=alert(1)>' };
    const html = journalLink(item);
    assert.ok(html.includes('data-link '));
    assert.ok(html.includes('data-uuid="JournalEntry.&quot;unsafe"'));
    assert.ok(html.includes('&lt;img'));
    assert.ok(!html.includes('<img'));
    assert.equal(journalLink({ ...item, type: 'weapon' }), '');
});

test('chat renderer appends only to valuable description cards and preserves original content and arguments', async () => {
    const item = valuable();
    item.attachment = { uuid: 'JournalEntry.id', type: 'JournalEntry', name: 'Clue' };
    const template = 'systems/TheWitcherTRPG/templates/chat/item/item-description.hbs';
    const wrapped = async (...args) => { assert.equal(args[2], 'options'); return '<section>Original</section>'; };
    const result = await appendJournalToChat(wrapped, template, { item }, 'options');
    assert.ok(result.startsWith('<section>Original</section>'));
    assert.ok(result.includes('data-uuid="JournalEntry.id"'));
    assert.equal(await appendJournalToChat(wrapped, 'other.hbs', { item }, 'options'), '<section>Original</section>');
    item.type = 'weapon';
    assert.equal(await appendJournalToChat(wrapped, template, { item }, 'options'), '<section>Original</section>');
});

test('configuration windows without a description field are left untouched', () => {
    renderValuableJournal({ document: valuable() }, { querySelector: () => null });
});
