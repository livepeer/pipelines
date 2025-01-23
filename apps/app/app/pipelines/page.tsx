"use client";

import { usePrivy, User } from "@privy-io/react-auth";
import LoggedOutComponent from "@/components/modals/logged-out";
import { useFetch } from "@/hooks/useFetch";
import { getPipelinesByUser } from "../api/pipelines/get";
import { LoaderCircleIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import track from "@/lib/track";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import Link from "next/link";

const EmptyState = ({ user }: { user: User | null }) => {
  const router = useRouter();
  return (
    <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium">No pipelines created yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first pipeline!
        </p>
        <Button
          onClick={() => {
            track(
              "my_pipelines_create_pipeline_clicked",
              undefined,
              user || undefined
            );
            router.replace(`/pipeline/create`);
          }}
          className="mt-4"
        >
          Create Pipeline
        </Button>
      </div>
    </div>
  );
};

// TODO: Remove this once all the changes are merged
const DEFAULT_USER_ID = "did:privy:cm32cnatf00nrx5pee2mpl42n";

export default function Page() {
  const { authenticated, user } = usePrivy();
  const fetchPipelines = useCallback(() => {
    return user?.id ? getPipelinesByUser(user.id) : Promise.resolve([]);
  }, [user]);
  const { data: pipelines, loading } = useFetch(fetchPipelines);

  if (!authenticated) {
    return <LoggedOutComponent text="Sign in to view your pipelines" />;
  }

  if (loading) {
    return <LoaderCircleIcon className="w-8 h-8 animate-spin" />;
  }

  if (!pipelines || pipelines?.length === 0) {
    return <EmptyState user={user} />;
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg">My Pipelines</h3>
      <TooltipProvider>
        <Table className="mt-8">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipelines.map((pipeline) => (
              <TableRow key={pipeline.id} className="h-12">
                <TableCell>
                  <Link href={`/pipelines/${pipeline.id}`}>
                    {pipeline.name}
                  </Link>
                </TableCell>
                <TableCell>{pipeline.description}</TableCell>
                <TableCell>{pipeline.type}</TableCell>
                <TableCell>
                  {new Date(pipeline.created_at).toLocaleDateString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="flex items-center gap-x-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/pipelines/${pipeline.id}?edit=true`}>
                        <PencilIcon />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Edit Pipeline</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        size="icon"
                        className="relative group"
                        onClick={() => {}}
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Pipeline</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
