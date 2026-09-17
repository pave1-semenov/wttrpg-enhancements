const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const button = (action, label, extra = "") => `<button type="button" data-timeline-action="${action}" ${extra}>${label}</button>`;

export function moveTimelineItem(items, sourceId, targetId, after = false) {
    const source = items.findIndex(item => item.id === sourceId);
    if (source < 0 || sourceId === targetId || !items.some(item => item.id === targetId)) return;
    const [item] = items.splice(source, 1);
    const target = items.findIndex(entry => entry.id === targetId);
    items.splice(target + Number(after), 0, item);
}

function codexType(doc) {
    return doc?.getFlag("campaign-codex", "type") || ({
        "campaign-codex.NPCSheet": "npc", "campaign-codex.LocationSheet": "location",
        "campaign-codex.ShopSheet": "shop", "campaign-codex.RegionSheet": "region",
        "campaign-codex.GroupSheet": "group", "campaign-codex.TagSheet": "tag",
        "campaign-codex.QuestSheet": "quest"
    })[doc?.flags?.core?.sheetClass];
}

export function createCampaignTimelineWidget(Base) {
    return class CampaignTimelineWidget extends Base {
        get canEdit() { return this.isGM && this.document.isOwner; }
        get editing() { return this.canEdit && this._editing === true; }

        async data() {
            const data = foundry.utils.deepClone((await this.getData()) || {});
            data.dates ??= [];
            // Migrate legacy single links in memory; the next edit persists the arrays.
            for (const row of data.dates.flatMap(date => [date, ...(date.events || [])])) {
                row.entries = [...new Set(Array.isArray(row.entries) ? row.entries : (row.entry ? [row.entry] : []))];
                row.npcs ??= [];
                delete row.entry;
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

        async links(row, field) {
            const uuids = row[field] || [];
            const links = await Promise.all(uuids.map(async uuid => {
                const doc = await fromUuid(uuid).catch(() => null);
                const visible = doc && (this.isGM || doc.testUserPermission(game.user, "OBSERVER"));
                if (!visible && !this.editing) return "";
                const label = visible ? escape(doc.name) : "Unavailable document";
                return `<span class="wtt-timeline-link">${visible ? button("open", label, `data-uuid="${escape(uuid)}"`) : label}${this.editing ? button("unlink", "×", `data-field="${field}" data-uuid="${escape(uuid)}" aria-label="Remove link"`) : ""}</span>`;
            }));
            const tags = links.join("");
            if (!tags && !this.editing) return "";
            const isNpc = field === "npcs";
            return `<div class="wtt-timeline-links" data-link-field="${field}" ${this.editing ? `data-drop-field="${field}"` : ""}>
                <span class="wtt-timeline-links-label" title="${isNpc ? "Related NPCs" : "Related entries"}" aria-label="${isNpc ? "Related NPCs" : "Related entries"}" role="img" tabindex="0"><i class="fas ${isNpc ? "fa-users" : "fa-book-open"}" aria-hidden="true"></i></span>
                <div class="wtt-timeline-tags">${tags}${this.editing ? `<span class="wtt-timeline-hint">Drop ${isNpc ? "Codex NPCs" : "Codex entries"} here</span>` : ""}</div>
            </div>`;
        }

        async row(row, parentId = "") {
            const editing = this.editing;
            const description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(row.description || "", {
                async: true, secrets: this.isGM, relativeTo: this.document
            });
            const controls = editing ? `<span class="wtt-timeline-handle" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">⠿</span>` : "";
            const actions = editing ? `<div class="wtt-timeline-actions">${button("edit", "Edit")}${button("up", "↑", 'aria-label="Move up"')}${button("down", "↓", 'aria-label="Move down"')}${button("delete", "Delete")}</div>` : "";
            const related = `${await this.links(row, "npcs")}${await this.links(row, "entries")}`;
            const children = !parentId ? await Promise.all((row.events || []).map(event => this.row(event, row.id))) : [];
            return `<section class="wtt-timeline-row ${parentId ? "wtt-timeline-event" : "wtt-timeline-date"}" data-row-id="${escape(row.id)}" data-parent-id="${escape(parentId)}">
                <div class="wtt-timeline-row-header">
                <div class="wtt-timeline-heading">${controls}<${parentId ? "h4" : "h3"}>${escape(row.label)}</${parentId ? "h4" : "h3"}>${actions}</div>
                ${related ? `<div class="wtt-timeline-related">${related}</div>` : ""}
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
                if (!this.editing || !event.target.closest(".wtt-timeline-handle")) return;
                const row = event.target.closest("[data-row-id]");
                event.stopPropagation();
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", JSON.stringify({ type: "WttTimeline", widgetId: this.widgetId,
                    documentUuid: this.document.uuid, id: row.dataset.rowId, parentId: row.dataset.parentId }));
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
                        items.push({ id: foundry.utils.randomID(), ...value, entries: [], npcs: [], events: [] });
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
                    const field = control.dataset.field;
                    if (!["entries", "npcs"].includes(field)) return false;
                    row[field] = row[field].filter(uuid => uuid !== control.dataset.uuid);
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
            const field = event.target.closest("[data-drop-field]")?.dataset.dropField;
            if (!["entries", "npcs"].includes(field) || !payload.uuid) return;
            let doc = await fromUuid(payload.uuid);
            if (doc?.documentName === "JournalEntryPage") doc = doc.parent;
            if (doc?.documentName !== "JournalEntry" || !codexType(doc) || (field === "npcs" && codexType(doc) !== "npc")) {
                return ui.notifications.warn(field === "npcs" ? "Drop a Campaign Codex NPC sheet here." : "Drop a Campaign Codex entry here.");
            }
            return this.mutate(data => {
                const { row } = this.locate(data, id, parentId);
                if (!row) return false;
                if (row[field].includes(doc.uuid)) return false;
                row[field].push(doc.uuid);
            }, root);
        }
    };
}
