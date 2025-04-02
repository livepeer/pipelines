import { User as PrivyUser } from "@/hooks/usePrivy";
import { hubspot as HubspotConfig } from "@/lib/env";

interface HubspotField {
  name: string;
  value: string;
}

export async function submitToHubspot(user: PrivyUser) {
  try {
    const fields: HubspotField[] = [
      {
        name: "email",
        value:
          user?.email?.address ||
          user?.google?.email ||
          user?.discord?.email ||
          (user.discord && `${user?.id}-discord-user@livepeer.org`) ||
          "",
      },
      {
        name: "firstname",
        value:
          user.google?.name ||
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
        portalId: HubspotConfig.portalId,
        formId: HubspotConfig.formId,
        fields,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to submit to HubSpot: ${errorData.error || response.statusText}`,
      );
    }

    console.log("Successfully submitted user to HubSpot");
  } catch (error) {
    console.error("Error submitting to HubSpot:", error);
  }
}
