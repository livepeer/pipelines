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
import { LogOut, MoonIcon, SunIcon, UserIcon } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";

export default function User({ className }: { className?: string }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { theme, setTheme } = useTheme();

  const name =
    user?.github?.name || user?.discord?.username || user?.email?.address;
  const email = typeof user?.email === "string" ? user.email : "";
  const provider = user?.github ? "GitHub" : "Discord";

  const disableLogin = !ready || authenticated;

  const checkUser = async (userToInsert: PrivyUser) => {
    await createUser(userToInsert);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    if (user?.id) {
      checkUser(user);
    }
  }, [user]);

  return authenticated ? (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("mt-2 flex items-center gap-2", className)}>
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
        <DropdownMenuItem className="h-10" onClick={toggleTheme}>
          {theme === "light" ? <SunIcon /> : <MoonIcon />}
          Toggle Theme
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Tooltip>
      <TooltipTrigger>
        <Button
          onClick={() => {
            track("login_clicked", undefined, user || undefined);
            login();
          }}
          disabled={disableLogin}
          variant="ghost"
          size="icon"
          className="mt-2 items-center"
        >
          <UserIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        Sign in
      </TooltipContent>
    </Tooltip>
  );
}
