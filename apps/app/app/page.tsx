import { Metadata } from "next";
import DayDreamContent from "@/components/daydream";

export const metadata: Metadata = {
  title: "Daydream",
  description: "Transform your video in real-time with AI",
};

export default function HomePage() {
  return <DayDreamContent />;
}
