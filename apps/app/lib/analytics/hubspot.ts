import { User as PrivyUser } from "@privy-io/react-auth";
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
          user.google?.email ||
          user.email?.address ||
          user.discord?.email ||
          user.github?.email ||
          "",
      },
      {
        name: "firstname",
        value:
          user.google?.name ||
          user.email?.address?.split("@")[0] ||
          user?.github?.name ||
          user?.discord?.username ||
          "",
      },
      { name: "user_id", value: user?.id || "" },
      {
        name: "signup_method",
        value: user?.google
          ? "Google"
          : user?.discord
            ? "Discord"
            : user?.github
              ? "GitHub"
              : "Email",
      },
    ];

    if (user?.discord?.username) {
      fields.push({ name: "discord_username", value: user.discord.username });
    }

    if (user?.github?.username) {
      fields.push({ name: "github_username", value: user.github.username });
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
