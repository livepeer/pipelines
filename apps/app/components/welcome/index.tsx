"use client";

import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarImage } from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  ScrollArea,
  ScrollBar,
} from "@repo/design-system/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import FeaturedPipelines from "./featured";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@repo/design-system/lib/utils";
import track from "@/lib/track";
import { useRouter, useSearchParams } from "next/navigation";
import Search from "../header/search";
import Link from "next/link";

export default function Head() {
  return (
    <div className="relative  border pr-4">
      <div className="grid md:grid-cols-3 gap-4 md:gap-10  p-4">
        <Intro />
        <div className="md:col-span-2">
          <CTA />
        </div>
        {/* {authenticated && <MyStats />}
        <Leaderboard /> */}
      </div>
    </div>
  );
}

const Intro = () => {
  const { user } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = user?.github?.name || user?.discord?.username;

  return (
    <div className="col-span-1">
      <h2 className="font-medium text-lg">
        {name ? `Welcome back, ${name}` : "Build Real-time Video AI Pipelines"}
      </h2>
      <p>Transform live video streams using AI models.</p>
      <div
        onClick={() => {
          router.replace("?tab=create");
        }}
        className="
      hover:border-primary/60 hover:text-primary/60 transition-all duration-200
      cursor-pointer
      mt-3 text-muted-foreground text-md border border-dashed  h-32 flex items-center justify-center"
      >
        <Plus className="h-7 w-7 mr-2" />
        Create Pipeline
      </div>
      <div className="flex">
        <Button
          onClick={() => {
            window.open("https://pipelines.livepeer.org/docs", "_blank");
          }}
          variant="ghost"
          className="mt-3  w-auto"
        >
          What is a pipeline? <ArrowTopRightIcon className="ml-1 h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            window.location.href = "https://pipelines.livepeer.org/explore";
          }}
          variant="ghost"
          className="mt-3  w-auto"
        >
          Explore examples <ArrowTopRightIcon className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { user } = usePrivy();
  const data = [
    { name: "Text to Speech", author: "johndoe", usage: 100 },
    { name: "Image to Image", author: "janedoe", usage: 95 },
    { name: "Video to Video", author: "janedoe", usage: 95 },
  ];

  return (
    <div className="col-span-1">
      <h3 className="font-medium text-lg">Leaderboard</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Usage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src="https://github.com/suhailkakar.png" />
                </Avatar>
                {row.author}
              </TableCell>
              <TableCell>{row.usage}k mins</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        onClick={() => {
          track("leaderboard_see_all_clicked", undefined, user || undefined);
        }}
        className="mt-2"
        variant="ghost"
      >
        See all <ArrowTopRightIcon className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

const MyStats = () => {
  const { user } = usePrivy();
  const data = [
    { name: "Text to Speech", users: 100, usage: 100 },
    { name: "Image to Image", users: 95, usage: 95 },
    { name: "Video to Video", users: 95, usage: 95 },
  ];

  return (
    <div className="col-span-1">
      <h3 className="font-medium text-lg">My Stats</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Usage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell className="flex items-center gap-2">
                {row.users} users
              </TableCell>
              <TableCell>{row.usage}k mins</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        onClick={() => {
          track("my_stats_see_all_clicked", undefined, user || undefined);
        }}
        className="mt-2"
        variant="ghost"
      >
        See all <ArrowTopRightIcon className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

const CTA = () => {
  return (
    <Link
      href={"https://discord.com/invite/hxyNHeSzCK"}
      target="_blank"
      style={{
        backgroundImage:
          "url('https://cdn.prod.website-files.com/66b1e1cb750c24d738b2c64b/66e7f4958c45556cb5bf3340_Card%20(52)%20(1).webp')",
      }}
      className=" h-full  flex flex-col  justify-center relative pl-6 bg-cover bg-center"
    >
      <h3 className="font-medium text-5xl uppercase text-white">
        Daily Challenge
      </h3>
      <p className="text-md my-4 text-white">
        Join our community to create unique video AI streams. <br />
        Each day is a new challenge.
      </p>
      <p className="text-md uppercase my-4 text-white">Join Community</p>
      <img
        src="https://cdn.prod.website-files.com/66b1e1cb750c24d738b2c64b/66b23b09ed2da9e4696256ad_Logo%20(6).svg"
        className="absolute bottom-4 right-6"
      />
    </Link>
  );
};
