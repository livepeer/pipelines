import { User as PrivyUser } from "@/hooks/usePrivy";

export async function identifyUser(
  userId: string,
  anonymousId: string,
  user: PrivyUser,
) {
  try {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString();

    const payload = {
      userId,
      anonymousId,
      properties: {
        $name: userId,
        distinct_id: userId,
        $email: user?.email?.address,
        user_id: userId,
        user_type: "authenticated",
        $last_login: currentDateString,
        authenticated: true,
        first_time_properties: {
          $first_login: currentDateString,
          first_wallet_address: user?.wallet?.address,
          first_email: user?.email?.address,
        },
      },
    };

    console.log("Sending identify request:", payload);

    const response = await fetch("/api/mixpanel/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to identify user: ${errorData.error || response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("Identify response:", data);
  } catch (error) {
    console.error("Error in identifyUser:", error);
  }
}
