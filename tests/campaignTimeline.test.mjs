import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Load this browser ES module without changing the module format of the repository.
const source = await readFile(new URL("../src/lib/widgets/campaignTimeline.js", import.meta.url), "utf8");
const { moveTimelineItem, createCampaignTimelineWidget } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
globalThis.foundry = { utils: { deepClone: structuredClone, escapeHTML: s => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;") },
    applications: { ux: { TextEditor: { implementation: { enrichHTML: async text => text } } } } };
globalThis.game = { user: {} };
globalThis.fromUuid = async () => null;
globalThis.ui = { notifications: { error: () => {} } };

class Base {
    constructor() { this.document = { isOwner: true, uuid: "JournalEntry.test" }; this.isGM = true; this.widgetId = "timeline"; this.saved = { dates: [] }; }
    async getData() { return this.saved; }
    async saveData(data) { this.saved = data; return this.document; }
    async _refreshWidget() {}
}
const Widget = createCampaignTimelineWidget(Base);

test("one drop area groups all Codex sheet types on dates and events", async () => {
    const originalFromUuid = globalThis.fromUuid;
    const originalWarn = ui.notifications.warn;
    let warnings = 0;
    ui.notifications.warn = () => warnings++;
    globalThis.fromUuid = async uuid => ({ uuid, name: uuid, documentName: "JournalEntry", getFlag: (_scope, key) => key === "type" ? uuid.split(".")[1] : null });
    try {
        for (const parentId of ["", "date"]) {
            const widget = new Widget();
            widget._editing = true;
            const row = { id: "row", events: [] };
            widget.saved.dates = parentId ? [{ id: parentId, events: [row] }] : [row];
            const element = { dataset: { rowId: "row", parentId } };
            for (const type of ["npc", "location", "region", "quest", "tag", "shop", "group", "journal"]) {
                const drop = uuid => widget.onDrop({ dataTransfer: { getData: () => JSON.stringify({ uuid }) },
                    target: { closest: selector => selector === "[data-row-id]" ? element : {} } });
                await drop(`JournalEntry.${type}.1`);
                await drop(`JournalEntry.${type}.2`);
                await drop(`JournalEntry.${type}.1`);
                const saved = widget.locate(await widget.data(), "row", parentId).row;
                assert.deepEqual(saved.linkGroups.find(group => group.id === type).uuids, [`JournalEntry.${type}.1`, `JournalEntry.${type}.2`]);
                await widget.onAction({ dataset: { timelineAction: "unlink", groupId: type, uuid: `JournalEntry.${type}.1` }, closest: () => element });
                assert.deepEqual(widget.locate(await widget.data(), "row", parentId).row.linkGroups.find(group => group.id === type).uuids, [`JournalEntry.${type}.2`]);
            }
            const html = await widget.render();
            assert.equal((html.match(/Drop any Campaign Codex sheet here/g) || []).length, parentId ? 2 : 1);
        }
        assert.equal(warnings, 0);
    } finally {
        globalThis.fromUuid = originalFromUuid;
        ui.notifications.warn = originalWarn;
    }
});

test("legacy links survive adding multiple entries, deduplication, removal, and reload", async () => {
    const originalFromUuid = globalThis.fromUuid;
    globalThis.fromUuid = async uuid => ({ uuid, name: uuid, documentName: "JournalEntry", getFlag: () => "location" });
    try {
        for (const parentId of ["", "date"]) {
            const widget = new Widget();
            widget._editing = true;
            const row = { id: "row", label: "Label", entry: "JournalEntry.old", npcs: [], events: [] };
            widget.saved.dates = parentId ? [{ id: parentId, events: [row] }] : [row];
            const element = { dataset: { rowId: "row", parentId } };
            const drop = { dataTransfer: { getData: () => JSON.stringify({ uuid: "JournalEntry.new" }) },
                target: { closest: selector => selector === "[data-row-id]" ? element : { dataset: { dropField: "entries" } } } };
            await widget.onDrop(drop);
            await widget.onDrop(drop);
            let saved = widget.locate(await widget.data(), "row", parentId).row;
            assert.deepEqual(saved.linkGroups, [{ id: "location", uuids: ["JournalEntry.old", "JournalEntry.new"] }]);
            assert.equal(saved.entry, undefined);
            await widget.onAction({ dataset: { timelineAction: "unlink", groupId: "location", uuid: "JournalEntry.old" }, closest: () => element });
            const reloaded = new Widget();
            reloaded.saved = structuredClone(widget.saved);
            saved = reloaded.locate(await reloaded.data(), "row", parentId).row;
            assert.deepEqual(saved.linkGroups, [{ id: "location", uuids: ["JournalEntry.new"] }]);
            const html = await reloaded.links(saved.linkGroups[0]);
            assert.match(html, /title="Locations"/);
            assert.doesNotMatch(html, />\s*Locations\s*</);
        }
    } finally {
        globalThis.fromUuid = originalFromUuid;
    }
});

test("manual order ignores date labels and preserves nested events", () => {
    const items = [{ id: "a", label: "Tomorrow", events: [{ id: "child" }] }, { id: "b", label: "Yesterday" }, { id: "c" }];
    moveTimelineItem(items, "a", "c", true);
    assert.deepEqual(items.map(x => x.id), ["b", "c", "a"]);
    assert.equal(items[2].events[0].id, "child");
    moveTimelineItem(items, "a", "b");
    assert.deepEqual(items.map(x => x.id), ["a", "b", "c"]);
    moveTimelineItem(items, "missing", "b");
    assert.equal(items.length, 3);
});

test("attachment and group order persist, with cross-group and cross-row moves blocked", async () => {
    for (const parentId of ["", "date"]) {
        const widget = new Widget();
        widget._editing = true;
        const row = { id: "row", linkGroups: [{ id: "npc", uuids: ["a", "b", "c"] }, { id: "quest", uuids: ["q"] }], events: [] };
        widget.saved.dates = parentId ? [{ id: parentId, events: [row] }] : [row];
        const bounds = () => ({ left: 0, width: 100 });
        const drop = (payload, groupId, uuid, clientX = 75) => widget.onDrop({
            clientX,
            dataTransfer: { getData: () => JSON.stringify({ type: "WttTimelineLinkOrder", widgetId: widget.widgetId, documentUuid: widget.document.uuid, id: "row", parentId, ...payload }) },
            target: { closest: selector => ({
                "[data-row-id]": { dataset: { rowId: "row", parentId } },
                ".wtt-timeline-links": { dataset: { groupId }, getBoundingClientRect: bounds },
                "[data-link-uuid]": { dataset: { linkUuid: uuid }, getBoundingClientRect: bounds }
            })[selector] }
        });
        await drop({ kind: "link", groupId: "npc", uuid: "a" }, "npc", "c");
        await drop({ kind: "group", groupId: "quest" }, "npc", null, 0);
        const expected = [{ id: "quest", uuids: ["q"] }, { id: "npc", uuids: ["b", "c", "a"] }];
        assert.deepEqual(widget.locate(await widget.data(), "row", parentId).row.linkGroups, expected);
        await drop({ kind: "link", groupId: "npc", uuid: "a" }, "quest", "q");
        await drop({ kind: "group", groupId: "npc", id: "other" }, "quest", null, 0);
        await drop({ kind: "group", groupId: "npc", documentUuid: "other" }, "quest", null, 0);
        assert.deepEqual(widget.locate(await widget.data(), "row", parentId).row.linkGroups, expected);
        const reloaded = new Widget();
        reloaded.saved = structuredClone(widget.saved);
        assert.deepEqual(reloaded.locate(await reloaded.data(), "row", parentId).row.linkGroups, expected);
    }
});

test("migration classifies mixed legacy entries, deduplicates, and preserves missing links", async () => {
    const original = globalThis.fromUuid;
    globalThis.fromUuid = async uuid => uuid === "missing" ? null : ({ getFlag: (_scope, key) => key === "type" ? (uuid === "npc" ? "npc" : "quest") : null });
    try {
        const widget = new Widget();
        widget.saved.dates = [{ id: "row", npcs: ["npc"], entries: ["npc", "quest", "missing"], events: [] }];
        const row = (await widget.data()).dates[0];
        assert.deepEqual(row.linkGroups, [{ id: "npc", uuids: ["npc"] }, { id: "quest", uuids: ["quest"] }, { id: "journal", uuids: ["missing"] }]);
        assert.equal(widget.saved.dates[0].linkGroups, undefined);
    } finally { globalThis.fromUuid = original; }
});

test("non-Codex drops are rejected and faction NPC sheets classify as factions", async () => {
    const original = globalThis.fromUuid;
    const originalWarn = ui.notifications.warn;
    let warnings = 0;
    ui.notifications.warn = () => warnings++;
    try {
        const widget = new Widget();
        widget._editing = true;
        widget.saved.dates = [{ id: "row", linkGroups: [] }];
        const drop = () => widget.onDrop({ dataTransfer: { getData: () => JSON.stringify({ uuid: "sheet" }) },
            target: { closest: selector => selector === "[data-row-id]" ? { dataset: { rowId: "row", parentId: "" } } : {} } });
        globalThis.fromUuid = async () => ({ uuid: "sheet", documentName: "Actor" });
        await drop();
        assert.equal(warnings, 1);
        globalThis.fromUuid = async () => ({ uuid: "sheet", documentName: "JournalEntry", getFlag: (_scope, key) => key === "type" ? "npc" : { tagMode: true } });
        await drop();
        assert.deepEqual(widget.saved.dates[0].linkGroups, [{ id: "tag", uuids: ["sheet"] }]);
    } finally { globalThis.fromUuid = original; ui.notifications.warn = originalWarn; }
});

test("view mode and players cannot mutate", async () => {
    const widget = new Widget();
    await widget.mutate(data => data.dates.push({ id: "no" }));
    widget._editing = true;
    widget.isGM = false;
    await widget.mutate(data => data.dates.push({ id: "no" }));
    assert.deepEqual(widget.saved.dates, []);
    assert.doesNotMatch(await widget.render(), /data-timeline-action/);
});

test("queued changes preserve both updates and widget instances isolate data", async () => {
    const widget = new Widget();
    widget._editing = true;
    await Promise.all([widget.mutate(data => data.dates.push({ id: "a" })), widget.mutate(data => data.dates.push({ id: "b" }))]);
    assert.deepEqual(widget.saved.dates.map(x => x.id), ["a", "b"]);
    assert.deepEqual((await new Widget().data()).dates, []);
});

test("player rendering hides inaccessible link names and escapes date text", async () => {
    const widget = new Widget();
    widget.isGM = false;
    widget.saved.dates.push({ id: "a", label: '<img src=x>', npcs: ["JournalEntry.secret"], events: [] });
    const html = await widget.render();
    assert.match(html, /&lt;img src=x>/);
    assert.doesNotMatch(html, /JournalEntry.secret|Unavailable document|draggable/);
});

test("event drop cannot move between dates or documents", async () => {
    const widget = new Widget();
    widget._editing = true;
    widget.saved.dates = [{ id: "a", events: [{ id: "event" }] }, { id: "b", events: [{ id: "target" }] }];
    const event = { dataTransfer: { getData: () => JSON.stringify({ type: "WttTimeline", widgetId: "timeline", documentUuid: "JournalEntry.test", id: "event", parentId: "a" }) },
        target: { closest: () => ({ dataset: { rowId: "target", parentId: "b" } }) } };
    await widget.onDrop(event);
    assert.equal(widget.saved.dates[0].events[0].id, "event");
    assert.equal(widget.saved.dates[1].events.length, 1);
});
