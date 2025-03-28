"use client";

import React, { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import LoggedOutComponent from "../logged-out";
import { usePrivy } from "@/hooks/usePrivy";
import { useRouter, useSearchParams } from "next/navigation";
import track from "@/lib/track";
import { useEffect } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import { createAPIKey, getAPIKeys } from "./action";

const Header = ({ onClick }: { onClick: () => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-lg font-medium">My API Keys</h4>
      <p className="text-sm text-muted-foreground">
        View all the API keys you have created
      </p>
    </div>
    <XIcon
      onClick={onClick}
      className="w-5 h-5 cursor-pointer"
      style={{ strokeWidth: 1.5 }}
    />
  </div>
);

export const APIKeys = ({ open }: { open: boolean }) => {
  if (!open) return null;

  const { authenticated, user } = usePrivy();
  const [showCreateAPIKey, setShowCreateAPIKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  const [apiKeyName, setApiKeyName] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const closeModal = () => {
    const { tab, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  const EmptyState = () => (
    <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium">No API keys created yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first API key!
        </p>
        <Button onClick={() => setShowCreateAPIKey(true)} className="mt-4">
          Create API Key
        </Button>
      </div>
    </div>
  );

  const handleCreateAPIKey = async () => {
    const apiKey = await createAPIKey(apiKeyName, user?.id);
    console.log(apiKey);
  };

  const CreateAPIKey = () => (
    <div className="mt-6 ">
      <h5 className="font-medium">Create API Key</h5>
      <Input
        className="mt-2"
        placeholder="API Key Name"
        value={apiKeyName}
        onChange={e => setApiKeyName(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          onClick={handleCreateAPIKey}
          disabled={!apiKeyName}
          className="mt-4"
        >
          Create API Key
        </Button>
        <Button
          onClick={() => setShowCreateAPIKey(false)}
          variant="outline"
          className="mt-4"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    track("my_pipelines_modal_opened", undefined, user || undefined);
    fetchAPIKeys();
  }, [user]);

  const fetchAPIKeys = async () => {
    const apiKeys = await getAPIKeys(user?.id);
    setApiKeys(apiKeys);
  };

  const RenderAPIKeys = () => (
    <div className="mt-2">
      {apiKeys.map(apiKey => (
        <div className="flex items-center justify-between">
          <div>{apiKey.name}</div>
          <div className="text-sm text-muted-foreground">********</div>
        </div>
      ))}
      <div className="flex space-y-3 flex-col">
        <div className="text-sm text-muted-foreground mt-2">
          You can only copy the API key at the time of creation.
        </div>
        <Button onClick={() => setShowCreateAPIKey(true)} className="w-full">
          Create API Key
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <Header onClick={closeModal} />
      {authenticated ? (
        <>
          {showCreateAPIKey ? (
            <CreateAPIKey />
          ) : (
            <>{apiKeys.length > 0 ? <RenderAPIKeys /> : <EmptyState />}</>
          )}
        </>
      ) : (
        <LoggedOutComponent text="Sign in to create API keys" />
      )}
    </div>
  );
};

export default APIKeys;
