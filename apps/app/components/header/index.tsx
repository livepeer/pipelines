"use client";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import User from "./user";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";

export default function Header() {
  const { user, authenticated } = usePrivy();

  const menuItems = [
    {
      label: "Explore",
      href: "/",
    },
    {
      label: "Learn",
      external: true,
      href: "https://pipelines.livepeer.org/docs",
    },
    {
      label: "Community",
      external: true,
      href: "https://discord.gg/5sZu8xmn6U",
    },
  ];

  const handleClickTrack = (label: string) => {
    track(
      label.toLowerCase() + "_button_clicked",
      {
        location: "header",
        is_authenticated: authenticated,
      },
      user || undefined,
    );
  };

  return (
    <div className="flex h-16 w-full items-center justify-between">
      <div className="flex items-center gap-8">{/* <Search /> */}</div>
      <div className="flex items-center gap-4">
        <div className="hidden gap-6 md:flex ">
          {menuItems.map(item => (
            <Link
              href={item.href}
              target={item.external ? "_blank" : undefined}
              key={item.label}
              className="text-muted-foreground text-sm hover:text-foreground"
              onClick={() => handleClickTrack(item.label)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          className="hidden md:flex"
          onClick={() => {
            window.open("https://github.com/livepeer/pipelines", "_blank");
            handleClickTrack("github");
          }}
        >
          <GitHubLogoIcon />
          <span>Github</span>
        </Button>
        <User />
        <ModeToggle />
      </div>
    </div>
  );
}
