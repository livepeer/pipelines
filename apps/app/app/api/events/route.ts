import { NextResponse } from 'next/server';
import { sendKafkaEvent } from '../metrics/kafka';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, streamId, playbackId, pipelineType, pipelineId, userId } = body;

    // Get viewer info from server-side
    const viewerInfoResponse = await fetch('http://ip-api.com/json/', { 
      headers: { 'User-Agent': request.headers.get('user-agent') || '' } 
    });
    const viewerInfo = await viewerInfoResponse.json();

    const timestamp = Date.now();
    const data = {
      type: eventType,
      timestamp,
      user_id: userId || 'anonymous',
      playback_id: playbackId,
      stream_id: streamId,
      pipeline: pipelineType,
      pipeline_id: pipelineId,
      viewer_info: {
        ip: viewerInfo.query,
        user_agent: request.headers.get('user-agent'),
        country: viewerInfo.country,
        city: viewerInfo.city
      }
    };

    console.log('[Kafka Event] Sending event:', JSON.stringify(data, null, 2));

    // Send event through Kafka
    await sendKafkaEvent(
      "stream_trace",
      data,
      "daydream",
      request.headers.get('host') || 'server'
    );

    console.log('[Kafka Event] Successfully sent event:', eventType);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send event' },
      { status: 500 }
    );
  }
} 