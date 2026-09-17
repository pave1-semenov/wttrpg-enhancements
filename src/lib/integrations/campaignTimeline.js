import { createCampaignTimelineWidget } from "../widgets/campaignTimeline.js";

export function registerCampaignTimeline() {
    const api = game.modules.get("campaign-codex")?.api;
    if (!api?.CampaignCodexWidget || !api?.widgetManager) return;
    api.widgetManager.registerWidget("Campaign Timeline", createCampaignTimelineWidget(api.CampaignCodexWidget));
}
