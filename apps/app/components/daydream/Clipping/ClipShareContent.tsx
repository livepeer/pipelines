import React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { ClipData } from "./types";
import { toast } from "sonner";
import useMobileStore from "@/hooks/useMobileStore";
import { TrackedButton } from "@/components/analytics/TrackedButton";

interface ClipShareContentProps {
  clipData: ClipData;
}

export default function ClipShareContent({ clipData }: ClipShareContentProps) {
  const { isMobile } = useMobileStore();
  const [copied, setCopied] = React.useState(false);

  // Create shareable URL with slug if available - if not fallback to storage url // TODO: remove storage url
  const shareableUrl = React.useMemo(() => {
    if (clipData.slug) {
      return `${window.location.origin}/clips/${clipData.slug}`;
    }
    return clipData.serverClipUrl || "";
  }, [clipData.slug, clipData.serverClipUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([shareableUrl], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  const handleAppBasedShare = async (platform: string) => {
    const appData =
      platform === "tiktok"
        ? {
            appUrl: "https://www.tiktok.com",
            appName: "TikTok",
          }
        : {
            appUrl: "https://www.instagram.com",
            appName: "Instagram",
          };
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([shareableUrl], { type: "text/plain" }),
        }),
      ]);

      // Try to use the Web Share API if available on mobile
      if (navigator.share && isMobile) {
        try {
          await navigator.share({
            title: "Check out my Daydream creation!",
            text: "Created this on daydream.live and had to share!",
            url: shareableUrl,
          });
          return;
        } catch (error) {
          console.error("Error sharing:", error);
          return;
        }
      }

      // Fallback: Open TikTok in browser and open it after 1.5 seconds to let user view toast.
      openUrlInNewTab(appData.appUrl, 1500);

      // Show toast with instructions
      toast("Link copied!", {
        description: `Paste the link to create your ${appData.appName} post.`,
        duration: 5000,
      });
    } catch (error) {
      console.error(`Failed to copy for ${appData.appName} sharing:`, error);
    }
  };

  const handleSocialShare = (platform: string) => {
    switch (platform) {
      case "instagram":
      case "tiktok":
        handleAppBasedShare(platform);
        break;
      case "x":
        const shareText = "This Daydream creation blew my mind!";
        const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareableUrl)}`;
        openUrlInNewTab(shareUrl);
        break;
      default:
        console.error(`Unsupported platform: ${platform}`);
    }
  };

  const handleDownload = async () => {
    if (!clipData.clipUrl || !clipData.clipFilename) return;

    // Use native share on mobile devices (especially iOS) to allow saving to camera roll
    if (navigator.share && isMobile) {
      try {
        // Fetch the video file as a blob
        const response = await fetch(clipData.clipUrl);
        const blob = await response.blob();

        // Determine file type from filename or blob
        const fileExtension = clipData.clipFilename
          .split(".")
          .pop()
          ?.toLowerCase();
        const mimeType =
          fileExtension === "mp4" ? "video/mp4" : blob.type || "video/mp4";

        // Create a File object for sharing
        const file = new File([blob], clipData.clipFilename, {
          type: mimeType,
        });

        await navigator.share({
          title: "Daydream Creation",
          text: "Check out my Daydream creation!",
          files: [file],
        });

        return;
      } catch (error) {
        console.error("Error sharing file:", error);
        // Fall back to traditional download if share fails
      }
    }

    // Traditional download for desktop or if share fails
    const downloadLink = document.createElement("a");
    downloadLink.href = clipData.clipUrl;
    downloadLink.download = clipData.clipFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
    }, 100);
  };

  return (
    <DialogContent className="max-w-lg mx-auto rounded-xl overflow-hidden flex flex-col gap-6 items-center py-12 px-6">
      <DialogHeader className="flex items-center">
        <DialogTitle className="text-2xl">Share Your Creation</DialogTitle>
        <DialogDescription className="font-light text-center">
          Download for your content workflow or share to social media for the
          world to see
        </DialogDescription>
      </DialogHeader>

      <p className="text-sm font-light">Your Unique Sharing Link:</p>

      <div className="flex relative gap-2 items-center w-full">
        <Input
          readOnly
          value={shareableUrl}
          className="flex-1 rounded-full py-6 px-8 pr-12 overflow-ellipsis"
        />
        <TrackedButton
          trackingEvent="daydream_clip_modal_share_clicked"
          trackingProperties={{
            method: "unique sharing link",
          }}
          onClick={handleCopy}
          variant="link"
          className="absolute right-0"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </TrackedButton>
      </div>

      <p className="text-sm font-light">Share Directly to:</p>

      <div className="flex flex-row flex-wrap justify-center items-center gap-5">
        <TrackedButton
          trackingEvent="daydream_clip_modal_share_clicked"
          trackingProperties={{
            method: "download",
          }}
          onClick={() => handleDownload()}
          className="animatedGradientButton w-12 h-12 !rounded-full bg-white border-2 border-transparent flex items-center justify-center relative overflow-hidden hover:bg-background"
          aria-label="Download clip"
        >
          <DownloadIcon className="w-6 h-6 text-black" />
        </TrackedButton>

        <TrackedButton
          trackingEvent="daydream_clip_modal_share_clicked"
          trackingProperties={{
            method: "tiktok",
          }}
          onClick={() => handleSocialShare("tiktok")}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black"
        >
          <TikTokIcon />
        </TrackedButton>

        <TrackedButton
          trackingEvent="daydream_clip_modal_share_clicked"
          trackingProperties={{
            method: "instagram",
          }}
          onClick={() => handleSocialShare("instagram")}
          className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #FBE18A, #FCBB45, #F75274, #D53692, #8F39CE, #5B4FE9)",
          }}
        >
          <InstagramIcon />
        </TrackedButton>

        <TrackedButton
          trackingEvent="daydream_clip_modal_share_clicked"
          trackingProperties={{
            method: "X",
          }}
          onClick={() => handleSocialShare("x")}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black"
        >
          <XIcon />
        </TrackedButton>
      </div>
    </DialogContent>
  );
}

const InstagramIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 45 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.9969 22.5C14.9969 18.358 18.3527 14.9994 22.4935 14.9994C26.6343 14.9994 29.992 18.358 29.992 22.5C29.992 26.642 26.6343 30.0006 22.4935 30.0006C18.3527 30.0006 14.9969 26.642 14.9969 22.5ZM10.9434 22.5C10.9434 28.881 16.1144 34.0535 22.4935 34.0535C28.8727 34.0535 34.0437 28.881 34.0437 22.5C34.0437 16.119 28.8727 10.9465 22.4935 10.9465C16.1144 10.9465 10.9434 16.119 10.9434 22.5ZM31.8017 10.4884C31.8015 11.0224 31.9596 11.5445 32.256 11.9887C32.5524 12.4328 32.9739 12.779 33.467 12.9836C33.9601 13.1881 34.5028 13.2418 35.0265 13.1378C35.5501 13.0339 36.0312 12.7769 36.4088 12.3995C36.7865 12.022 37.0437 11.541 37.1481 11.0173C37.2524 10.4936 37.1992 9.95071 36.9951 9.45726C36.791 8.96382 36.4452 8.542 36.0014 8.24514C35.5577 7.94828 35.0359 7.78972 34.502 7.78951H34.5009C33.7854 7.78984 33.0991 8.07427 32.593 8.58031C32.087 9.08635 31.8023 9.77264 31.8017 10.4884ZM13.4061 40.8145C11.2131 40.7146 10.0211 40.3492 9.22901 40.0405C8.17883 39.6315 7.42952 39.1445 6.64171 38.3575C5.8539 37.5705 5.36624 36.8217 4.95919 35.7713C4.6504 34.9793 4.28511 33.7866 4.18542 31.5929C4.07637 29.2212 4.05459 28.5088 4.05459 22.5002C4.05459 16.4916 4.07817 15.7812 4.18542 13.4075C4.28529 11.2138 4.65328 10.0235 4.95919 9.22915C5.36804 8.17867 5.85498 7.42915 6.64171 6.64111C7.42844 5.85307 8.17703 5.36527 9.22901 4.95811C10.0208 4.64923 11.2131 4.28382 13.4061 4.1841C15.7771 4.07502 16.4894 4.05324 22.4935 4.05324C28.4977 4.05324 29.2106 4.07682 31.5836 4.1841C33.7766 4.284 34.9666 4.65211 35.7608 4.95811C36.8109 5.36527 37.5602 5.85415 38.3481 6.64111C39.1359 7.42807 39.6217 8.17867 40.0306 9.22915C40.3394 10.0212 40.7047 11.2138 40.8043 13.4075C40.9134 15.7812 40.9352 16.4916 40.9352 22.5002C40.9352 28.5088 40.9134 29.2193 40.8043 31.5929C40.7045 33.7866 40.3374 34.9789 40.0306 35.7713C39.6217 36.8217 39.1348 37.5713 38.3481 38.3575C37.5613 39.1437 36.8109 39.6315 35.7608 40.0405C34.969 40.3494 33.7766 40.7148 31.5836 40.8145C29.2126 40.9236 28.5004 40.9454 22.4935 40.9454C16.4867 40.9454 15.7764 40.9236 13.4061 40.8145ZM13.2199 0.13626C10.8253 0.24534 9.18906 0.625141 7.76009 1.18134C6.28019 1.75572 5.02739 2.5263 3.77549 3.77658C2.52359 5.02687 1.75522 6.28201 1.181 7.76233C0.62496 9.19261 0.245269 10.8285 0.136221 13.2237C0.0253727 15.6228 0 16.3897 0 22.5C0 28.6103 0.0253727 29.3773 0.136221 31.7763C0.245269 34.1718 0.62496 35.8074 1.181 37.2377C1.75522 38.7171 2.52377 39.9737 3.77549 41.2235C5.02721 42.4732 6.28019 43.2427 7.76009 43.8187C9.19176 44.3749 10.8253 44.7547 13.2199 44.8638C15.6195 44.9729 16.385 45.0001 22.4935 45.0001C28.6021 45.0001 29.3688 44.9747 31.7672 44.8638C34.1619 44.7547 35.7971 44.3749 37.227 43.8187C38.706 43.2427 39.9597 42.4737 41.2116 41.2235C42.4635 39.9732 43.2302 38.7171 43.8061 37.2377C44.3621 35.8074 44.7436 34.1716 44.8508 31.7763C44.9599 29.3755 44.9853 28.6103 44.9853 22.5C44.9853 16.3897 44.9599 15.6228 44.8508 13.2237C44.7418 10.8283 44.3621 9.19171 43.8061 7.76233C43.2302 6.28291 42.4615 5.02885 41.2116 3.77658C39.9616 2.52432 38.706 1.75572 37.2288 1.18134C35.7971 0.625141 34.1617 0.24354 31.769 0.13626C29.3706 0.02718 28.6039 0 22.4953 0C16.3868 0 15.6195 0.02538 13.2199 0.13626Z"
      fill="white"
    />
  </svg>
);

const XIcon = () => (
  <div className="relative w-4 h-4">
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="x-icon"
    >
      <g>
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="white"
        />
      </g>
    </svg>
  </div>
);

const TikTokIcon = () => (
  <div className="relative w-4 h-4">
    <svg
      width="24"
      height="24"
      viewBox="0 0 34 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.3125 14.3889C26.3086 16.5206 29.8965 17.6596 33.5725 17.6458V10.3541C32.8498 10.3561 32.1291 10.2787 31.4234 10.1232V15.9323C27.7392 15.9388 24.146 14.7868 21.1513 12.6389V27.6353C21.1422 30.0961 20.468 32.5086 19.2001 34.6169C17.9321 36.7253 16.1178 38.4509 13.9494 39.6108C11.7811 40.7707 9.33949 41.3216 6.88363 41.2052C4.42776 41.0888 2.04914 40.3094 0 38.9495C1.89541 40.869 4.31727 42.1823 6.95891 42.7233C9.60056 43.2642 12.3432 43.0083 14.8394 41.9881C17.3357 40.9679 19.4733 39.2292 20.9817 36.9922C22.49 34.7552 23.3012 32.1205 23.3125 29.4218V14.3889ZM25.9716 6.95137C24.448 5.29849 23.5132 3.18781 23.3125 0.947914V0H21.2727C21.5249 1.42379 22.0736 2.77853 22.8831 3.97615C23.6927 5.17378 24.745 6.18748 25.9716 6.95137ZM4.72322 33.177C4.01621 32.2516 3.58294 31.1462 3.47272 29.9865C3.36249 28.8269 3.57974 27.6595 4.09974 26.6173C4.61973 25.5751 5.42159 24.7 6.41406 24.0915C7.40652 23.483 8.54972 23.1655 9.71356 23.1753C10.3561 23.1751 10.9949 23.2735 11.6077 23.467V15.9323C10.8914 15.8373 10.1689 15.7967 9.44644 15.8107V21.6683C7.95434 21.1963 6.33937 21.3036 4.92275 21.969C3.50612 22.6345 2.39164 23.8092 1.80098 25.2596C1.21032 26.71 1.18674 28.3298 1.73495 29.7968C2.28316 31.2638 3.36298 32.4706 4.75965 33.177H4.72322Z"
        fill="#EE1D52"
      />
    </svg>
    <svg
      width="24"
      height="24"
      viewBox="0 0 35 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.8139 12.4837C27.7833 14.6134 31.346 15.7557 34.9991 15.7492V9.98935C32.9177 9.54889 31.027 8.46571 29.5935 6.89253C28.3772 6.13511 27.3338 5.12998 26.5311 3.94249C25.7284 2.75501 25.1843 1.41173 24.9343 0H19.613V29.1727C19.608 30.464 19.1992 31.7213 18.4439 32.7682C17.6885 33.815 16.6246 34.5988 15.4014 35.0096C14.1783 35.4203 12.8574 35.4373 11.624 35.0583C10.3907 34.6793 9.30698 33.9232 8.52492 32.8962C7.28553 32.2702 6.29296 31.2446 5.70737 29.9849C5.12178 28.7251 4.97732 27.3045 5.29729 25.9525C5.61726 24.6004 6.38301 23.3957 7.47099 22.5327C8.55896 21.6697 9.90571 21.1987 11.2939 21.1957C11.9309 21.1978 12.5639 21.2952 13.172 21.4849V15.6769C10.5446 15.74 7.99275 16.5696 5.82974 18.0639C3.66672 19.5581 1.98668 21.6519 0.995843 24.0884C0.0050044 26.5248 -0.253511 29.1978 0.252033 31.7792C0.757576 34.3606 2.00518 36.7381 3.84168 38.6198C5.8739 39.9778 8.23609 40.7587 10.6766 40.8792C13.1172 40.9996 15.5447 40.4553 17.7006 39.304C19.8564 38.1528 21.6599 36.4378 22.919 34.3418C24.178 32.2457 24.8454 29.8471 24.85 27.4014L24.8139 12.4837Z"
        fill="white"
      />
    </svg>
    <svg
      width="24"
      height="24"
      viewBox="0 0 37 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.9997 11.7284V10.1798C35.0956 10.1879 33.2282 9.65508 31.6145 8.64323C33.039 10.215 34.9242 11.295 36.9997 11.7284ZM26.9729 1.77666C26.9729 1.50056 26.8889 1.21245 26.853 0.93635V0H19.5367V29.0749C19.5304 30.7029 18.8789 32.2619 17.7254 33.4097C16.5719 34.5575 15.0105 35.2003 13.3839 35.1972C12.4261 35.202 11.4809 34.9798 10.6253 34.5489C11.4044 35.5721 12.4841 36.3253 13.7128 36.7029C14.9414 37.0805 16.2574 37.0635 17.4759 36.6544C18.6945 36.2452 19.7544 35.4643 20.5069 34.4214C21.2594 33.3785 21.6667 32.126 21.6716 30.8395V1.77666H26.9729ZM15.2549 17.3825V15.7379C12.2443 15.3285 9.184 15.9518 6.57266 17.5062C3.96131 19.0606 1.95295 21.4544 0.87488 24.2974C-0.203189 27.1405 -0.287395 30.2652 0.635985 33.1623C1.55936 36.0594 3.43589 38.558 5.95972 40.251C4.14397 38.3721 2.91431 36.0045 2.42095 33.4374C1.92759 30.8704 2.1919 28.2152 3.18159 25.7961C4.17128 23.3769 5.84349 21.2987 7.99394 19.8152C10.1444 18.3318 12.68 17.5073 15.2909 17.4425L15.2549 17.3825Z"
        fill="#69C9D0"
      />
    </svg>
  </div>
);

const openUrlInNewTab = (url: string, delay?: number) => {
  // Create a new anchor element and clicks it
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";

  // Add a delay between when the anchor element is created and when it is clicked
  setTimeout(async () => {
    anchor.click();
    anchor.remove();
  }, delay ?? 0);
};
