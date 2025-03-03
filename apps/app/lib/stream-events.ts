import { User } from "@privy-io/react-auth";

interface ViewerInfo {
  ip: string;
  user_agent: string;
  country: string;
  city: string;
  subdivision?: string;
  latitude?: number;
  longitude?: number;
}

export const sendStreamEvent = async (
  eventType: string,
  streamId: string,
  playbackId: string | undefined,
  pipelineType: string,
  pipelineId: string,
  user?: User
) => {
  try {
    const payload = {
      eventType,
      streamId,
      playbackId,
      pipelineType,
      pipelineId,
      userId: user?.id
    };
    console.log('[Client Event] Sending event:', JSON.stringify(payload, null, 2));

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send event: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[Client Event] Event sent successfully:', eventType);
    return result.success;
  } catch (error) {
    console.error('Failed to send event:', error);
    return false;
  }
}; 