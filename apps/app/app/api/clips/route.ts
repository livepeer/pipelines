import { NextResponse } from 'next/server';

const VIDEOS = [
  "https://storage.googleapis.com/thom-vod-testing/daydream-01.mp4",
  "https://storage.googleapis.com/thom-vod-testing/daydream-02.mp4",
  "https://storage.googleapis.com/thom-vod-testing/daydream-03.mp4",
  "https://storage.googleapis.com/thom-vod-testing/daydream-04.mp4",
  "https://storage.googleapis.com/thom-vod-testing/daydream-05.mp4",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || '0');
  const limit = Number(searchParams.get('limit') || '10');
  
  const startIndex = page * limit % VIDEOS.length;
  const clips = Array.from({ length: limit }).map((_, i) => {
    const index = (startIndex + i) % VIDEOS.length;
    return {
      id: `clip-${page}-${i}`,
      src: VIDEOS[index],
      title: `Daydream Clip ${index + 1}`,
    };
  });
  
  // artificial delay // db simul
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json({
    clips,
    hasMore: true, //fake infinite pagination
  });
} 