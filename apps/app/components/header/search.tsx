"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import { Input } from "@repo/design-system/components/ui/input";
import { Button } from "@repo/design-system/components/ui/button";
import React, { useState, useEffect } from "react";
import track from "@/lib/track";
import { fetchPipelines, fetchFeaturedPipelines } from "./fetchPipelines";
import { LoaderCircleIcon } from "lucide-react";
import {Badge} from "@repo/design-system/components/ui/badge";


const PipelineCommand = ({ pipeline, onSelect, uniqueModifier = "unique" }: { pipeline: any; onSelect: (value: string) => void; uniqueModifier?: string }) => {
  return (
      <CommandItem value={`${pipeline.name}-${pipeline.id}-${uniqueModifier}`}
                   key={`${pipeline.id}-${uniqueModifier}`}
                   onSelect={() => onSelect(pipeline)}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex-shrink-0">
            {pipeline.cover_image ? (
                <img
                    className="h-8 w-8 object-cover rounded"
                    src={pipeline.cover_image}
                    alt="pipeline"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.classList.add("hidden");
                    }}
                />
            ) : (
                <div className="h-full w-full bg-gray-200 rounded" aria-hidden="true"></div>
            )}
          </div>
          <div className="flex justify-between items-center w-full">
            <span>{pipeline.name}</span>
            {pipeline.type == "comfyui" && (
                <Badge className="bg-green-500/90 text-white font-medium text-xs ml-4">
                  Comfy UI
                </Badge>
            )}
          </div>
        </div>
      </CommandItem>
  );
};

export default function Search({
                                 pipeline, onPipelineSelect
                               }: {
  pipeline?: any;
  onPipelineSelect?: (pipeline: any) => void
}) {
  const [open, setOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<any | null>(pipeline);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [featuredPipelines, setFeaturedPipelines] = useState<any>([]);

  useEffect(() => {
    if (open) {
      const loadFeaturedPipelines = async () => {
        const featured = await fetchFeaturedPipelines();
        setFeaturedPipelines(featured);
      };
      loadFeaturedPipelines();
    }
  }, [open]);

  const selectPipeline = (pipeline: any) => {
    if (!pipeline) {
      console.error("No pipeline selected.");
      return;
    }
    setSelectedPipeline(pipeline);
    setOpen(false);
    setQuery("");
    if (onPipelineSelect) {
      onPipelineSelect(pipeline);
    }
  };

  useEffect(() => {
    // when query changes, this local var will
    // prevent the result from a previous search
    // from setting the results state (aka prevent race condition)
    // so that results are in sync with the latest query.
    let isCancelled = false;

    const fetchData = async () => {
      if (query.length >= 3) {
        setIsSearching(true);
        const data = await fetchPipelines(query);
        console.log('isCancelled', isCancelled)
        if (!isCancelled) {
          console.log(data)
          setIsSearching(false);
          setResults(data);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [query]);

  return (
      <div>
        <Input
            placeholder="Search Pipelines"
            value={selectedPipeline?.name || ""}
            readOnly={true}
            onClick={() => {
              track("search_clicked");
              setOpen(true);
            }}
        />
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput
              value={query}
              onValueChange={(value) => setQuery(value)}
              placeholder="Search Pipelines..."
          />
          <CommandList>
            {isSearching ? (
              <CommandEmpty>
                <div className="flex justify-center items-center py-4">
                  <LoaderCircleIcon className="w-8 h-8 animate-spin" />
                </div>
              </CommandEmpty>
            ) : query.length === 0 ? (
                <CommandGroup heading="Featured Pipelines">
                  {featuredPipelines.map((pipeline: any) => (
                      <PipelineCommand key={`${pipeline.id}-command`} pipeline={pipeline} uniqueModifier={"featured"}
                                       onSelect={() => selectPipeline(pipeline)}/>
                  ))}
                </CommandGroup>
            ) : query.length < 3 ? (
                <CommandEmpty>Enter at least three characters to begin searching.</CommandEmpty>
            ) : results.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
            ) : (
                <CommandGroup heading="Search Results">
                  {results.map((pipeline: any) => (
                      <PipelineCommand key={`${pipeline.id}-command`} pipeline={pipeline}
                                       onSelect={() => selectPipeline(pipeline)}/>
                  ))}
                </CommandGroup>
            )}
          </CommandList>

        </CommandDialog>
      </div>
  );
}
