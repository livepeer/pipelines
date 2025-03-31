"use client";

import React from "react";
import { XIcon } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import LoggedOutComponent from "./logged-out";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import track from "@/lib/track";
import { useEffect } from "react";

const Header = ({ onClick }: { onClick: () => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-lg font-medium">My Pipelines</h4>
      <p className="text-sm text-muted-foreground">
        View all the pipelines you have created
      </p>
    </div>
    <XIcon
      onClick={onClick}
      className="w-5 h-5 cursor-pointer"
      style={{ strokeWidth: 1.5 }}
    />
  </div>
);

export const MyPipelines = ({ open }: { open: boolean }) => {
  const { user } = usePrivy();
  if (!open) return null;

  const { authenticated } = usePrivy();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pipeline = searchParams.get("pipeline");
  const tab = searchParams.get("activeTab");

  const closeModal = () => {
    const { tab, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  const EmptyState = () => (
    <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium">No pipelines created yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first pipeline!
        </p>
        <Button onClick={() => router.replace(`/?tab=create`)} className="mt-4">
          Create Pipeline
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    track("my_pipelines_modal_opened", undefined, user || undefined);
  }, [user]);

  return (
    <div className="p-4">
      <Header onClick={closeModal} />
      {authenticated ? (
        <EmptyState />
      ) : (
        <LoggedOutComponent text="Sign in to view your pipelines" />
      )}
    </div>
  );
};

export default MyPipelines;
