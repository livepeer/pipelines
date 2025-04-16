import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { BentoGrids } from "./BentoGrids";
import Header from "./Header";

async function getInitialClips() {
  const clips = await db
    .select()
    .from(clipsTable)
    .orderBy(clipsTable.created_at)
    .limit(12);

  return clips.map(clip => ({
    id: String(clip.id),
    video_url: clip.video_url,
    created_at: clip.created_at.toISOString(),
    prompt: clip.prompt,
  }));
}

export default async function Explore() {
  const initialClips = await getInitialClips();

  return (
    <>
      <div className="bg-gray-50 relative isolate">
        <Header />
        <BentoGrids initialClips={initialClips} />
      </div>
    </>
  );
}
