"use client";

import useMobileStore from "@/hooks/useMobileStore";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { cn } from "@repo/design-system/lib/utils";
import { LogOut, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGuestUserStore } from "@/hooks/useGuestUser";

export default function User({ className }: { className?: string }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { isMobile } = useMobileStore();
  const router = useRouter();
  const { setIsGuestUser } = useGuestUserStore();

  const name =
    user?.discord?.username || user?.google?.name || user?.email?.address;
  const provider = user?.google
    ? "Google"
    : user?.discord
      ? "Discord"
      : "Email";

  const disableLogin = !ready || authenticated;

  const handleLoginClick = () => {
    track("login_clicked", undefined, user || undefined);

    if (!authenticated) {
      localStorage.setItem("daydream_from_guest_experience", "true");
      setIsGuestUser(false);
    } else {
      login();
    }
  };

  return authenticated ? (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-start gap-2", className)}>
        <Avatar className="h-6 w-6 -ml-[0.25rem]">
          <AvatarImage
            src={`https://github.com/${user?.github?.username}.png`}
            alt={name || ""}
            className="rounded-lg"
          />
          <AvatarFallback className="bg-gray-300 dark:bg-gray-800">
            <span className="capitalize text-foreground">
              {name?.charAt(0)}
            </span>
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 p-3 pb-1"
        side={isMobile ? "top" : "right"}
        align="end"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarImage
                src={`https://github.com/${user?.github?.username}.png`}
                alt={name || ""}
                className="rounded-lg"
              />
              <AvatarFallback className="rounded-lg">
                <span className="capitalize">{name?.charAt(0)}</span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col ">
              <span className="text-sm">{name}</span>
              <span className="text-muted-foreground text-sm ">
                via {provider}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10" onClick={logout}>
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      onClick={handleLoginClick}
      disabled={disableLogin}
      variant="ghost"
      size="icon"
      className={cn(
        "flex items-center justify-start w-full gap-2 px-2",
        isMobile && "ml-4",
        "text-foreground",
      )}
    >
      <UserIcon className="text-foreground" />
      <span className="block md:hidden">Sign in</span>
    </Button>
  );
}
