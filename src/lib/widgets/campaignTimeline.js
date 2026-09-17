const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const button = (action, label, extra = "") => `<button type="button" data-timeline-action="${action}" ${extra}>${label}</button>`;
const LINK_GROUPS = {
    npc: { label: "NPCs", icon: "fa-users" },
    location: { label: "Locations", icon: "fa-map-marker-alt" },
    region: { label: "Regions", icon: "fa-map" },
    quest: { label: "Quests", icon: "fa-scroll" },
    tag: { label: "Factions", icon: "fa-flag" },
    shop: { label: "Shops", icon: "fa-store" },
    group: { label: "Groups", icon: "fa-layer-group" },
    journal: { label: "Entries", icon: "fa-book-open" }
};

export function moveTimelineItem(items, sourceId, targetId, after = false) {
    const source = items.findIndex(item => item.id === sourceId);
    if (source < 0 || sourceId === targetId || !items.some(item => item.id === targetId)) return;
    const [item] = items.splice(source, 1);
    const target = items.findIndex(entry => entry.id === targetId);
    items.splice(target + Number(after), 0, item);
}

function codexType(doc) {
    const type = doc?.getFlag("campaign-codex", "type") || ({
        "campaign-codex.NPCSheet": "npc", "campaign-codex.LocationSheet": "location",
        "campaign-codex.ShopSheet": "shop", "campaign-codex.RegionSheet": "region",
        "campaign-codex.GroupSheet": "group", "campaign-codex.TagSheet": "tag",
        "campaign-codex.QuestSheet": "quest"
    })[doc?.flags?.core?.sheetClass];
    // Codex can represent factions using NPC sheets in tag mode.
    return type === "npc" && doc.getFlag("campaign-codex", "data")?.tagMode ? "tag" : type;
}

function attach(row, type, uuid) {
    if (row.linkGroups.some(group => group.uuids.includes(uuid))) return false;
    let group = row.linkGroups.find(group => group.id === type);
    if (!group) row.linkGroups.push(group = { id: type, uuids: [] });
    group.uuids.push(uuid);
}

export function createCampaignTimelineWidget(Base) {
    return class CampaignTimelineWidget extends Base {
        get canEdit() { return this.isGM && this.document.isOwner; }
        get editing() { return this.canEdit && this._editing === true; }

        async data() {
            const data = foundry.utils.deepClone((await this.getData()) || {});
            data.dates ??= [];
            // Resolve legacy generic links into typed groups without writing on render.
            for (const row of data.dates.flatMap(date => [date, ...(date.events || [])])) {
                if (!Array.isArray(row.linkGroups)) {
                    row.linkGroups = [];
                    const legacy = [
                        [row.npcs || [], "npc"],
                        [row.entries || (row.entry ? [row.entry] : []), "journal"],
                        [row.locations || [], "location"], [row.regions || [], "region"]
                    ];
                    for (const [uuids, fallback] of legacy) {
                        for (const uuid of uuids) {
                            const doc = await fromUuid(uuid).catch(() => null);
                            attach(row, codexType(doc) || fallback, uuid);
                        }
                    }
                }
                for (const field of ["entry", "entries", "npcs", "locations", "regions"]) delete row[field];
            }
            return data;
        }

        // Serialize local mutations and always read the latest persisted data.
        async mutate(callback, root) {
            const task = (this._pending || Promise.resolve()).then(async () => {
                if (!this.editing) return;
                const data = await this.data();
                if (await callback(data) === false) return;
                if (!await this.saveData(data)) throw new Error("Timeline could not be saved.");
                await this._refreshWidget(root);
            });
            this._pending = task.catch(error => {
                console.error("Campaign Timeline", error);
                ui.notifications.error("Could not save the timeline. Please try again.");
            });
            return this._pending;
        }

        async links(group) {
            const { id: type, uuids } = group;
            const links = await Promise.all(uuids.map(async uuid => {
                const doc = await fromUuid(uuid).catch(() => null);
                const visible = doc && (this.isGM || doc.testUserPermission(game.user, "OBSERVER"));
                if (!visible && !this.editing) return "";
                const label = visible ? escape(doc.name) : "Unavailable document";
                const handle = this.editing ? `<span class="wtt-timeline-link-handle" draggable="true" data-drag-kind="link" tabindex="0" role="button" title="Drag to reorder link; arrow keys also move it" aria-label="Reorder link">⠿</span>` : "";
                return `<span class="wtt-timeline-link" data-link-uuid="${escape(uuid)}">${handle}${visible ? button("open", label, `data-uuid="${escape(uuid)}"`) : label}${this.editing ? button("unlink", "×", `data-group-id="${escape(type)}" data-uuid="${escape(uuid)}" aria-label="Remove link"`) : ""}</span>`;
            }));
            const tags = links.join("");
            if (!tags) return "";
            const config = Object.hasOwn(LINK_GROUPS, type) ? LINK_GROUPS[type] : { label: type, icon: "fa-book-open" };
            return `<div class="wtt-timeline-links" data-group-id="${escape(type)}">
                <span class="wtt-timeline-links-label" title="${escape(config.label)}${this.editing ? " — drag to reorder group; arrow keys also move it" : ""}" aria-label="${escape(config.label)}" role="${this.editing ? "button" : "img"}" tabindex="0" ${this.editing ? 'draggable="true" data-drag-kind="group"' : ""}><i class="fas ${config.icon}" aria-hidden="true"></i></span>
                <div class="wtt-timeline-tags">${tags}</div>
            </div>`;
        }

        async row(row, parentId = "") {
            const editing = this.editing;
            const description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(row.description || "", {
                async: true, secrets: this.isGM, relativeTo: this.document
            });
            const controls = editing ? `<span class="wtt-timeline-handle" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">⠿</span>` : "";
            const actions = editing ? `<div class="wtt-timeline-actions">${button("edit", "Edit")}${button("up", "↑", 'aria-label="Move up"')}${button("down", "↓", 'aria-label="Move down"')}${button("delete", "Delete")}</div>` : "";
            const related = (await Promise.all(row.linkGroups.map(group => this.links(group)))).join("");
            const children = !parentId ? await Promise.all((row.events || []).map(event => this.row(event, row.id))) : [];
            return `<section class="wtt-timeline-row ${parentId ? "wtt-timeline-event" : "wtt-timeline-date"}" data-row-id="${escape(row.id)}" data-parent-id="${escape(parentId)}">
                <div class="wtt-timeline-row-header">
                <div class="wtt-timeline-heading">${controls}<${parentId ? "h4" : "h3"}>${escape(row.label)}</${parentId ? "h4" : "h3"}>${actions}</div>
                ${related || editing ? `<div class="wtt-timeline-attachments" ${editing ? 'data-entity-drop="true"' : ""}><div class="wtt-timeline-related">${related}</div>${editing ? '<div class="wtt-timeline-drop-hint">Drop any Campaign Codex sheet here</div>' : ""}</div>` : ""}
                ${description ? `<div class="wtt-timeline-description">${description}</div>` : ""}
                </div>
                ${!parentId ? `<div class="wtt-timeline-events">${children.join("")}</div>${editing ? button("add-event", "+ Add event") : ""}` : ""}
            </section>`;
        }

        async render() {
            const data = await this.data();
            return `<div id="widget-${escape(this.widgetId)}" class="wtt-timeline ${this.editing ? "is-editing" : ""}">
                <header><h2>Timeline</h2>${this.canEdit ? button("toggle", this.editing ? "Done" : "Edit timeline") : ""}</header>
                ${data.dates.length ? `<div class="wtt-timeline-dates">${(await Promise.all(data.dates.map(row => this.row(row)))).join("")}</div>` : '<p class="wtt-timeline-empty">No events yet.</p>'}
                ${this.editing ? button("add-date", "+ Add date") : ""}</div>`;
        }

        locate(data, id, parentId) {
            const items = parentId ? data.dates.find(date => date.id === parentId)?.events : data.dates;
            return { items, row: items?.find(item => item.id === id) };
        }

        async editRow(row, isEvent) {
            return foundry.applications.api.DialogV2.prompt({
                window: { title: isEvent ? "Timeline event" : "Timeline date" },
                position: { width: 600 }, classes: ["wtt-timeline-editor"], rejectClose: false,
                content: `<div class="form-group"><label>${isEvent ? "Time / free text" : "Date"}</label><input name="label" required value="${escape(row.label)}" placeholder="${isEvent ? "Morning, 10:00, …" : "Any date format"}"></div>
                    <label>Description</label><prose-mirror name="description" value="${escape(row.description)}"></prose-mirror>`,
                ok: { label: "Save", callback: (_event, button) => ({
                    label: button.form.elements.label.value.trim(),
                    description: button.form.querySelector("prose-mirror").value
                }) }
            });
        }

        async activateListeners(root) {
            root.addEventListener("click", event => {
                const control = event.target.closest("[data-timeline-action]");
                if (!control) return;
                event.preventDefault();
                event.stopPropagation();
                this.onAction(control, root).catch(error => {
                    console.error("Campaign Timeline", error);
                    ui.notifications.error("The timeline action could not be completed.");
                });
            });
            root.addEventListener("dragstart", event => {
                const handle = event.target.closest("[data-drag-kind]");
                if (this.editing && handle) {
                    const row = handle.closest("[data-row-id]");
                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", JSON.stringify({ type: "WttTimelineLinkOrder", widgetId: this.widgetId,
                        documentUuid: this.document.uuid, id: row.dataset.rowId, parentId: row.dataset.parentId,
                        kind: handle.dataset.dragKind, groupId: handle.closest(".wtt-timeline-links").dataset.groupId,
                        uuid: handle.closest("[data-link-uuid]")?.dataset.linkUuid }));
                    return;
                }
                if (!this.editing || !event.target.closest(".wtt-timeline-handle")) return;
                const row = event.target.closest("[data-row-id]");
                event.stopPropagation();
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", JSON.stringify({ type: "WttTimeline", widgetId: this.widgetId,
                    documentUuid: this.document.uuid, id: row.dataset.rowId, parentId: row.dataset.parentId }));
            });
            root.addEventListener("keydown", event => {
                const handle = event.target.closest("[data-drag-kind]");
                if (!this.editing || !handle || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                const element = handle.closest("[data-row-id]");
                const container = root.closest(".cc-widget-container") || root.parentElement;
                const groupId = handle.closest(".wtt-timeline-links").dataset.groupId;
                const uuid = handle.closest("[data-link-uuid]")?.dataset.linkUuid;
                const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
                this.mutate(data => {
                    const { row } = this.locate(data, element.dataset.rowId, element.dataset.parentId);
                    if (!row) return false;
                    const group = row.linkGroups.find(group => group.id === groupId);
                    const items = uuid ? group?.uuids.map(id => ({ id })) : row.linkGroups;
                    const id = uuid || groupId;
                    const target = items?.[items.findIndex(item => item.id === id) + direction];
                    if (!target) return false;
                    moveTimelineItem(items, id, target.id, direction > 0);
                    if (uuid) group.uuids = items.map(item => item.id);
                }, root).then(() => {
                    // Refresh replaces the DOM; restore keyboard focus to the moved handle.
                    const row = container?.querySelector(`[data-row-id="${CSS.escape(element.dataset.rowId)}"]`);
                    const selector = uuid ? `[data-link-uuid="${CSS.escape(uuid)}"] [data-drag-kind]` : `.wtt-timeline-links[data-group-id="${CSS.escape(groupId)}"] > [data-drag-kind]`;
                    row?.querySelector(selector)?.focus();
                });
            });
            root.addEventListener("dragover", event => {
                if (!this.editing) return;
                event.preventDefault();
                event.stopPropagation();
            });
            root.addEventListener("drop", event => {
                if (!this.editing) return;
                event.preventDefault();
                event.stopPropagation();
                this.onDrop(event, root).catch(error => {
                    console.error("Campaign Timeline", error);
                    ui.notifications.warn("This document could not be attached.");
                });
            });
        }

        async onAction(control, root) {
            const action = control.dataset.timelineAction;
            if (action === "open") {
                const doc = await fromUuid(control.dataset.uuid);
                if (doc && (this.isGM || doc.testUserPermission(game.user, "OBSERVER"))) doc.sheet.render(true);
                return;
            }
            if (!this.canEdit) return;
            if (action === "toggle") {
                await this._pending;
                this._editing = !this.editing;
                return this._refreshWidget(root);
            }
            if (!this.editing) return;
            const element = control.closest("[data-row-id]");
            const id = element?.dataset.rowId;
            const parentId = element?.dataset.parentId;
            if (["add-date", "add-event", "edit"].includes(action)) {
                const existing = action === "edit" ? this.locate(await this.data(), id, parentId).row : null;
                const value = await this.editRow(existing || { label: "", description: "" }, action === "add-event" || !!parentId);
                if (!value) return;
                if (!value.label) return ui.notifications.warn("Enter a date or event time.");
                return this.mutate(data => {
                    if (action === "edit") {
                        const { row } = this.locate(data, id, parentId);
                        if (!row) return false;
                        Object.assign(row, value);
                    } else {
                        const items = action === "add-date" ? data.dates : data.dates.find(date => date.id === id)?.events;
                        if (!items) return false;
                        items.push({ id: foundry.utils.randomID(), ...value, linkGroups: [], events: [] });
                    }
                }, root);
            }
            if (action === "delete" && !await this.confirmationDialog("Delete this timeline entry and any events inside it?")) return;
            return this.mutate(data => {
                const { items, row } = this.locate(data, id, parentId);
                if (!row) return false;
                const index = items.indexOf(row);
                if (action === "delete") items.splice(index, 1);
                else if (action === "unlink") {
                    const group = row.linkGroups.find(group => group.id === control.dataset.groupId);
                    if (!group) return false;
                    group.uuids = group.uuids.filter(uuid => uuid !== control.dataset.uuid);
                    row.linkGroups = row.linkGroups.filter(group => group.uuids.length);
                } else if (action === "up" || action === "down") {
                    const target = items[index + (action === "up" ? -1 : 1)];
                    if (!target) return false;
                    moveTimelineItem(items, id, target.id, action === "down");
                } else return false;
            }, root);
        }

        async onDrop(event, root) {
            let payload;
            try { payload = JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return; }
            const element = event.target.closest("[data-row-id]");
            if (!element) return;
            const { rowId: id, parentId } = element.dataset;
            if (payload.type === "WttTimelineLinkOrder") {
                if (payload.widgetId !== this.widgetId || payload.documentUuid !== this.document.uuid || payload.id !== id || payload.parentId !== parentId) return;
                const targetGroup = event.target.closest(".wtt-timeline-links");
                const targetLink = event.target.closest("[data-link-uuid]");
                const target = payload.kind === "group" ? targetGroup : targetLink;
                if (!target || !targetGroup || !["group", "link"].includes(payload.kind)) return;
                if (payload.kind === "link" && payload.groupId !== targetGroup.dataset.groupId) return;
                const bounds = target.getBoundingClientRect();
                const after = event.clientX > bounds.left + bounds.width / 2;
                return this.mutate(data => {
                    const { row } = this.locate(data, id, parentId);
                    if (!row) return false;
                    if (payload.kind === "group") moveTimelineItem(row.linkGroups, payload.groupId, targetGroup.dataset.groupId, after);
                    else {
                        const group = row.linkGroups.find(group => group.id === payload.groupId);
                        if (!group) return false;
                        const items = group.uuids.map(id => ({ id }));
                        moveTimelineItem(items, payload.uuid, targetLink.dataset.linkUuid, after);
                        group.uuids = items.map(item => item.id);
                    }
                }, root);
            }
            if (payload.type === "WttTimeline") {
                if (payload.widgetId !== this.widgetId || payload.documentUuid !== this.document.uuid || payload.parentId !== parentId) return;
                const bounds = element.getBoundingClientRect();
                const after = event.clientY > bounds.top + bounds.height / 2;
                return this.mutate(data => {
                    const { items } = this.locate(data, id, parentId);
                    if (!items) return false;
                    moveTimelineItem(items, payload.id, id, after);
                }, root);
            }
            if (!event.target.closest("[data-entity-drop]") || !payload.uuid) return;
            let doc = await fromUuid(payload.uuid);
            if (doc?.documentName === "JournalEntryPage") doc = doc.parent;
            if (doc?.documentName !== "JournalEntry" || !codexType(doc)) {
                return ui.notifications.warn("Drop a Campaign Codex sheet here.");
            }
            return this.mutate(data => {
                const { row } = this.locate(data, id, parentId);
                if (!row) return false;
                return attach(row, codexType(doc), doc.uuid);
            }, root);
        }
    };
}
