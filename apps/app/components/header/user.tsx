"use client";

import track from "@/lib/track";
import { usePrivy, User as PrivyUser } from "@privy-io/react-auth";
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
import { createUser } from "./action";
import { LogOut, UserIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { identifyUser } from "@/lib/analytics/mixpanel";
import { submitToHubspot } from "@/lib/analytics/hubspot";
export default function User({ className }: { className?: string }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const isMobile = useIsMobile();

  const name =
    user?.github?.name || user?.discord?.username || user?.email?.address;
  const email = typeof user?.email === "string" ? user.email : "";
  const provider = user?.github ? "GitHub" : "Discord";

  const disableLogin = !ready || authenticated;

  const checkUser = async (userToInsert: PrivyUser) => {
    return await createUser(userToInsert);
  };

  useEffect(() => {
    const initUser = async () => {
      if (user?.id) {
        const { isNewUser } = await checkUser(user);
        const distinctId = localStorage.getItem("mixpanel_distinct_id");
        localStorage.setItem("mixpanel_user_id", user.id);

        await Promise.all([
          identifyUser(user.id, distinctId || "", user),
          // TODO: only submit to Hubspot on production
          isNewUser ? submitToHubspot(user) : Promise.resolve(),
        ]);

        track("user_logged_in", {
          user_id: user.id,
          distinct_id: distinctId,
        });
      }
    };

    initUser().catch(console.error);
  }, [user]);

  return authenticated ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("mt-2 flex items-center gap-2", className)}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={`https://github.com/${user?.github?.username}.png`}
            alt={name || ""}
            className="rounded-lg"
          />
          <AvatarFallback className="bg-gray-300 dark:bg-gray-800">
            <span className="capitalize">{name?.charAt(0)}</span>
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-3 pb-1" side="right" align="end">
        <div>
          <p className="mb-2 text-muted-foreground text-sm">{email}</p>
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
      onClick={() => {
        track("login_clicked", undefined, user || undefined);
        login();
      }}
      disabled={disableLogin}
      variant="ghost"
      size="icon"
      className={cn(
        "flex items-center justify-start w-full gap-2 px-2",
        isMobile && "ml-4",
      )}
    >
      <UserIcon />
      <span className="block md:hidden">Sign in</span>
    </Button>
  );
}
