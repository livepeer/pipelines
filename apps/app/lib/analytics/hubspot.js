"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitToHubspot = submitToHubspot;
exports.submitCapacityNotification = submitCapacityNotification;
const env_1 = require("@/lib/env");
async function submitToHubspot(user) {
    try {
        const fields = [
            {
                name: "email",
                value: user?.email?.address ||
                    user?.google?.email ||
                    user?.discord?.email ||
                    (user.discord && `${user?.id}-discord-user@livepeer.org`) ||
                    "",
            },
            {
                name: "firstname",
                value: user.google?.name ||
                    user?.discord?.username ||
                    user.email?.address?.split("@")[0] ||
                    (user.discord && `${user?.id}-discord-user`) ||
                    "",
            },
            { name: "user_id", value: user?.id || "" },
            {
                name: "signup_method",
                value: user?.google ? "Google" : user?.discord ? "Discord" : "Email",
            },
        ];
        if (user?.discord?.username) {
            fields.push({ name: "discord_username", value: user.discord.username });
        }
        const response = await fetch("/api/hubspot/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                portalId: env_1.hubspot.portalId,
                formId: env_1.hubspot.formId,
                fields,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to submit to HubSpot: ${errorData.error || response.statusText}`);
        }
        console.log("Successfully submitted user to HubSpot");
    }
    catch (error) {
        console.error("Error submitting to HubSpot:", error);
    }
}
async function submitCapacityNotification(email) {
    try {
        const fields = [
            { name: "email", value: email },
            { name: "source", value: "capacity_notification" },
        ];
        const url = `https://api.hsforms.com/submissions/v3/integration/submit/${env_1.hubspot.portalId}/${env_1.hubspot.capacityFormId}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fields,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to submit to HubSpot: ${errorData.error || response.statusText}`);
        }
        return true;
    }
    catch (error) {
        console.error("Error submitting capacity notification to HubSpot:", error);
        return false;
    }
}
