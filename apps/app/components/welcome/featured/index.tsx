import PipelineTile from "./tile";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

export const pipelines = [
  {
    id: "pip_fPJPE3QdSw2SrF6W",
    title: "Live Portrait",
    description:
      "A real-time video to video model that can generate videos from text prompts.",
    image: "liveportrait.gif",
    huggingFaceId: "",
    docs: "https://docs.livepeer.org/api-reference/generate/video-to-video",
    isComfyUI: false,
    isFeatured: true,
  },
  {
    id: "pip_p4XsqEJk2ZqqWLuw",
    title: "Stream Diffusion",
    description:
      "A real-time video to video model that can generate videos from text prompts.",
    image: "StreamDiffusion.jpg",
    huggingFaceId: "",
    docs: "https://docs.livepeer.org/api-reference/generate/video-to-video",
    isComfyUI: false,
    isFeatured: true,
  },
  {
    id: "pip_p4XsqEJk2ZqqWLuw",
    title: "Depth Anything",
    description:
      "A highly practical solution for robust monocular depth estimation.",
    image: "depth-anything.png",
    huggingFaceId: "",
    docs: "https://docs.livepeer.org/api-reference/generate/video-to-video",
    isComfyUI: false,
    isFeatured: true,
  }
];

const dummyPlaybackIds = [
  {
    playbackId: "c99filnga205mzqh",
    socialHandle: "@johndoe",
    socialUrl: "https://twitter.com"
  },
  {
    playbackId: "c99filnga205mzqh",
    socialHandle: "@johndoe",
    socialUrl: "https://twitter.com"
  },  
  {
    playbackId: "c99filnga205mzqh",
    socialHandle: "@johndoe",
    socialUrl: "https://twitter.com"
  }
];

export default function Winners() {
  return (
    <div className="relative  border p-4 mt-4">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-medium text-lg">Yesterday's Highlights</h3>
          <p className="text-muted-foreground text-sm w-full">
            Check out yesterday's prompt challenge winners.
          </p>
        </div>
        <div>
          <Link
            href={"https://discord.gg/livepeer"}
            target="_blank"
            className="text-sm gap-1 flex items-center -ml-20 -mt-8 md:-ml-0 md:-mt-0"
          >
            Join Today's Challenge on Discord
            <ArrowTopRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-3">
        {dummyPlaybackIds.map((item) => (
          <div className="aspect-video relative">
            <iframe
              src={`https://lvpr.tv/?v=${item.playbackId}`}
              className="w-full h-full"
            />
            <div className="absolute top-2  right-2 z-10 overflow-auto">
              <Link
                href={item.socialUrl}
                target="_blank"
                className={
                  "flex items-center gap-1 overflow-hidden bg-white px-2 py-0.5 text-black text-xs"
                }
              >
                {item.socialHandle}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
