"use client";

import {usePrivy} from "@privy-io/react-auth";
import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import track from "@/lib/track";
import {getStreams} from "@/app/api/streams/get";
import {deleteStream} from "@/app/api/streams/delete";
import {toast} from "sonner";
import {Copy, LoaderCircleIcon, PencilIcon, SettingsIcon, TrashIcon} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@repo/design-system/components/ui/tooltip";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@repo/design-system/components/ui/table";
import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "@repo/design-system/components/ui/dialog";
import {Button} from "@repo/design-system/components/ui/button";
import StreamStatusIndicator from "@/components/stream/stream-status-indicator";
import ConfirmDialog from "@/components/modals/confirm";
import LoggedOutComponent from "@/components/modals/logged-out";
import { app as appEnv } from "@/lib/env";

import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import {DoubleArrowLeftIcon, DoubleArrowRightIcon} from "@radix-ui/react-icons";
import Modals from "@/components/modals";

export default function MyStreams({searchParams}: {
  searchParams: any;
}){
  const { authenticated, user, ready:isAuthLoaded } = usePrivy();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedStreamIdForDelete, setSelectedStreamIdForDelete] = useState<string | null>(null);
  const limit = 10;
  const copyIconSize = 18;

  const router = useRouter();

  const EmptyState = () => (
      <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
        <div className="text-center">
          <h3 className="text-lg font-medium">No streams created yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first stream!
          </p>
          <Button onClick={
            () => {
              track('my_streams_create_stream_clicked', undefined, user || undefined);
              router.replace(`/stream/create`);
            }
          } className="mt-4">
            Create Stream
          </Button>
        </div>
      </div>
  );

  useEffect(() => {
    track("my_streams_opened");
    if (authenticated && user) {
      fetchStreams(user?.id, page);
    } else if (isAuthLoaded) {
      setLoading(false);
    }
  }, [authenticated, user, page]);

  const fetchStreams = async (userId: string, page: number) => {
    setLoading(true);
    try {
      const streams = await getStreams(userId, page, limit);
      setStreams(streams?.data);
      setTotalPages(Math.ceil(streams.totalPages / limit));
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStream = (streamId: string) => {
    setSelectedStreamIdForDelete(streamId);
    setDialogOpen(true);
  };

  const handleDeleteStream = async () => {
    if(selectedStreamIdForDelete && user?.id) {
      await deleteStream(selectedStreamIdForDelete);
      fetchStreams(user?.id, page);
      setDialogOpen(false);
    }
  };

  const cancelDeleteStream = () => {
    setSelectedStreamIdForDelete(null);
    setDialogOpen(false);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  const handleFirstPage = () => {
    setPage(1);
  };

  const handleLastPage = () => {
    setPage(totalPages);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
      <div className="p-4">
        {loading ? (
            <LoaderCircleIcon className="w-8 h-8 animate-spin" />) :
            !authenticated ?(
                <LoggedOutComponent text="Sign in to view your streams" />
                )
             : streams.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="col-span-1">

                  <ConfirmDialog
                      title="Delete Stream"
                      prompt="Are you sure you want to delete this stream? This action cannot be undone."
                      okMessage="Delete Stream"
                      callback={async () => await handleDeleteStream()}
                      open={isDialogOpen}
                      onClose={cancelDeleteStream}
                  />
                  <h3 className="font-medium text-lg">My Streams</h3>
                  <TooltipProvider>

                    <Table className="mt-8">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Stream Name</TableHead>
                          <TableHead>Ingest URL</TableHead>
                          <TableHead>Destination URL</TableHead>
                          <TableHead>Stream Key</TableHead>
                          <TableHead>Pipeline</TableHead>
                          <TableHead>Date Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {streams.map((stream) => (
                            <TableRow key={stream.stream_key}>
                              <TableCell>
                                <StreamStatusIndicator
                                    streamId={stream?.id}
                                />
                              </TableCell>
                              <TableCell>
                                <a href={`/stream/${stream.id}`} className="block truncate max-w-[200px]">{stream.name}</a>
                              </TableCell>
                              <TableCell>
                                <div className="inline-flex items-center gap-x-2 w-full">
                                  <span className="truncate max-w-[200px]">
                                    {appEnv.rtmpUrl}{appEnv?.rtmpUrl?.endsWith('/')?'':'/'}{stream.stream_key}
                                  </span>
                                  <Copy size={copyIconSize} className="mr-2 cursor-pointer flex-shrink-0" onClick={() => copy(`${appEnv.rtmpUrl}${appEnv?.rtmpUrl?.endsWith('/')?'':'/'}${stream.stream_key}`)} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="inline-flex items-center gap-x-2 w-full">
                                  <span className="truncate max-w-[200px]">
                                    {stream.output_stream_url}
                                  </span>
                                  <Copy size={copyIconSize} className="mr-2 cursor-pointer flex-shrink-0" onClick={() => copy(stream.output_stream_url)} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="inline-flex items-center gap-x-2">
                                  {stream.stream_key}
                                  <Copy size={copyIconSize} className="mr-2 cursor-pointer" onClick={() => copy(stream.stream_key)} />
                                </div>
                              </TableCell>
                              <TableCell>
                                {stream.pipelines.name}
                              </TableCell>
                              <TableCell>{new Date(stream.created_at).toLocaleDateString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                              <TableCell className="flex items-center gap-x-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={`/stream/${stream.id}`} className="relative group">
                                      <PencilIcon />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Edit Stream
                                  </TooltipContent>
                                </Tooltip>
                                <Dialog>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DialogTrigger asChild>
                                        <SettingsIcon className="cursor-pointer" />
                                      </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View Stream Details
                                    </TooltipContent>
                                  </Tooltip>
                                  <DialogContent className="w-auto max-w-max">
                                    <DialogTitle>Stream Settings</DialogTitle>
                                    <div className="mt-8">
                                      <div className="mb-2">
                                        <strong>Stream Id:</strong> {stream.id}
                                      </div>
                                      <div className="mb-2">
                                        <strong>Stream Key: </strong>
                                        <div className="inline-flex items-center gap-x-2">
                                          {stream.stream_key}
                                          <Copy size={copyIconSize} className="mr-2 cursor-pointer"
                                                onClick={() => copy(stream.stream_key)}/>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Pipeline:</strong> {stream.pipelines.name}
                                      </div>
                                      <div className="mb-2">
                                        <strong>Ingest URL (RTMP): </strong>
                                        <div className="inline-flex items-center gap-x-2">
                                          {appEnv?.rtmpUrl}{appEnv?.rtmpUrl?.endsWith('/') ? '' : '/'}{stream.stream_key}
                                          <Copy size={copyIconSize} className="mr-2 cursor-pointer"
                                                onClick={() => copy(`${appEnv?.rtmpUrl}${appEnv?.rtmpUrl?.endsWith('/') ? '' : '/'}${stream.stream_key}`)}/>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Ingest URL (WHIP): </strong>
                                        <div className="inline-flex items-center gap-x-2">
                                          {appEnv?.whipUrl}{appEnv?.whipUrl?.endsWith('/') ? '' : '/'}{stream.stream_key}/whip
                                          <Copy size={copyIconSize} className="mr-2 cursor-pointer"
                                                onClick={() => copy(`${appEnv?.whipUrl}${appEnv?.whipUrl?.endsWith('/') ? '' : '/'}${stream.stream_key}/whip`)}/>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Destination URL: </strong>
                                        <div className="inline-flex items-center gap-x-2">
                                          {stream.output_stream_url}
                                          <Copy size={copyIconSize} className="mr-2 cursor-pointer"
                                                onClick={() => copy(stream.output_stream_url)}/>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Playback Id: </strong>
                                        <div className="inline-flex items-center gap-x-2">
                                          {stream.output_playback_id}
                                          <Copy size={copyIconSize} className="mr-2 cursor-pointer"
                                                onClick={() => copy(stream.output_playback_id)}/>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <div className="inline-flex items-center gap-x-2">
                                          <strong>Parameters: </strong>
                                          <Copy
                                              size={copyIconSize}
                                              className="mr-2 cursor-pointer"
                                              onClick={() =>
                                                  copy(
                                                      typeof stream.pipeline_params === "object"
                                                          ? JSON.stringify(stream.pipeline_params, undefined, 4)
                                                          : stream.pipeline_params
                                                  )
                                              }
                                          />
                                        </div>
                                      </div>
                                      {/** add style work around to pre tag as tailwind not showing the scrollbar otherwise */}
                                      <pre
                                          className="text-xs p-2 mt-2 rounded-md overflow-y-scroll max-h-64 whitespace-pre-wrap"
                                          style={{
                                            scrollbarWidth: "auto",
                                            scrollbarColor: "gray lightgray",
                                          }}
                                      >
                                          {typeof stream.pipeline_params === "object"
                                              ? JSON.stringify(stream.pipeline_params, undefined, 4)
                                              : stream.pipeline_params}
                                    </pre>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                        className="relative group"
                                        onClick={() => confirmDeleteStream(stream.id)}
                                    >
                                      <TrashIcon/>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Delete Stream
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                  <Pagination className="flex justify-between items-center mt-4">
                    <PaginationLink onClick={handleFirstPage}
                                    aria-label="Go to first page"
                                    size="default"
                                    className={page === 1 ? "opacity-50 cursor-not-allowed" : "gap-1 pl-2.5 cursor-pointer"}>
                      <DoubleArrowLeftIcon className="h-4 w-4" />
                      <span>First</span>
                    </PaginationLink>
                    <PaginationPrevious onClick={handlePreviousPage}
                                        className={page === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} />
                    <PaginationContent>
                      Page {page} of {totalPages}
                    </PaginationContent>
                    <PaginationNext
                        className={page === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} onClick={handleNextPage} />
                    <PaginationLink onClick={handleLastPage}
                                    aria-label="Go to last page"
                                    size="default"
                                    className={page === totalPages ? "opacity-50 cursor-not-allowed" : "gap-1 pl-2.5 cursor-pointer"}>
                      <DoubleArrowRightIcon className="h-4 w-4" />
                      <span>Last</span>
                    </PaginationLink>
                  </Pagination>
                </div>
            )}
        <Modals searchParams={searchParams} />
      </div>
  );
}