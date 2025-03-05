"use client";

import { usePrivy, User } from "@privy-io/react-auth";
import LoggedOutComponent from "@/components/modals/logged-out";
import { useFetch } from "@/hooks/useFetch";
import { getPipelinesByUser } from "../api/pipelines/get";
import {
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
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
import { deletePipeline } from "../api/pipelines/delete";
import { toast } from "sonner";
import ConfirmDialog from "@/components/modals/confirm";

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
            router.replace(`/pipelines/create`);
          }}
          className="mt-4"
        >
          Create Pipeline
        </Button>
      </div>
    </div>
  );
};

export default function Page() {
  const router = useRouter();
  const { authenticated, user } = usePrivy();

  const fetchPipelines = useCallback(() => {
    return user?.id ? getPipelinesByUser(user.id) : Promise.resolve([]);
  }, [user]);
  const { data: pipelines, loading, refetch } = useFetch(fetchPipelines);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedPipelineIdForDelete, setSelectedPipelineIdForDelete] =
    useState<string | null>(null);

  const handleDelete = useCallback(
    async (pipelineId: string | null) => {
      if (!pipelineId) return;
      const toastId = toast.loading("Deleting pipeline...");
      try {
        await deletePipeline(pipelineId, user?.id || "");
        toast.success("Pipeline deleted successfully", {
          id: toastId,
        });
        refetch();
      } catch (error) {
        toast.error("Failed to delete pipeline", {
          id: toastId,
        });
      } finally {
        setDialogOpen(false);
      }
    },
    [user],
  );

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-lg">My Pipelines</h3>
        <LoaderCircleIcon className="w-8 h-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-lg">My Pipelines</h3>
        <LoggedOutComponent text="Sign in to view your pipelines" />
      </div>
    );
  }

  if (!pipelines || pipelines?.length === 0) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-lg">My Pipelines</h3>
        <EmptyState user={user} />
      </div>
    );
  }

  // TODO: remove non-admin restriction when pre-validation is available
  if (!user?.email?.address?.endsWith("@livepeer.org")) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium">Access Restricted</h3>
      </div>
    );
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
            {pipelines.map(pipeline => (
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
                      <Button
                        variant="link"
                        size="icon"
                        className="relative group"
                        onClick={() => {
                          router.push(`/pipelines/${pipeline.id}`);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Pipeline</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        size="icon"
                        className="relative group"
                        onClick={() => {
                          setSelectedPipelineIdForDelete(pipeline.id);
                          setDialogOpen(true);
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Pipeline</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        size="icon"
                        className="relative group"
                        onClick={() => {
                          router.push(`/playground/${pipeline.id}`);
                        }}
                      >
                        <PlayIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View in Playground</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
      <ConfirmDialog
        title="Delete Pipeline"
        prompt="Are you sure you want to delete this pipeline? This action cannot be undone."
        okMessage="Confirm"
        callback={async () => await handleDelete(selectedPipelineIdForDelete)}
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
