/** Open descriptions without changing the bonus selection or card layout. */
export function renderBonusDialog(dialog) {
    const root = dialog.element;
    if (!root?.querySelectorAll) return;
    const buttons = root.querySelectorAll('[data-bonus-description-open]');
    for (const button of buttons) {
        const description = button.previousElementSibling;
        button.onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            // Use an independent dialog, bypassing the roll flows' patched prompt helper.
            return new foundry.applications.api.DialogV2({
                window: { title: button.closest('.situational-bonus-card').querySelector('strong').textContent },
                position: { width: 560, top: null, left: null },
                modal: true,
                content: `<div class="situational-bonus-description-dialog">${description.innerHTML}</div>`,
                buttons: [{ action: 'close', label: 'Close', default: true }]
            }).render({ force: true });
        };
    }
}
