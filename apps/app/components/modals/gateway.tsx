"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import track from "@/lib/track";
import { Label } from "@repo/design-system/components/ui/label";
import { usePrivy } from "@/hooks/usePrivy";

export default function Gateway() {
  const { user } = usePrivy();
  const [showGateway, setShowGateway] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const gateway = searchParams.get("gateway");

  const handleClose = () => {
    setShowGateway(false);
    const { gateway, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  const handleSave = () => {
    toast.success("Saved gateway provider");
    handleClose();
  };

  useEffect(() => {
    setShowGateway(gateway === "true");

    if (gateway === "true") {
      track("gateway_modal_opened", undefined, user || undefined);
    }
  }, [gateway, user]);

  return (
    <AlertDialog open={showGateway} onOpenChange={setShowGateway}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-medium">
            Gateway Provider
          </AlertDialogTitle>
          <AlertDialogDescription>
            Livepeer Pipelines are run on the distributed Livepeer Network.
            Gateway providers simplify the process of using the network. In a
            future release, you will be able to change your gateway provider at
            any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select defaultValue="livepeer">
          <SelectTrigger>
            <SelectValue placeholder="Select Gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="livepeer">Livepeer Pipelines</SelectItem>
          </SelectContent>
        </Select>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const _CreditSelection = ({
  onSelect,
}: {
  onSelect: (value: null | number) => void;
}) => {
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const creditOptions = [
    { value: 300, label: "300 credits" },
    { value: 600, label: "600 credits" },
    { value: 3000, label: "3000 credits" },
    { value: 6000, label: "6000 credits" },
  ];

  const handleCreditSelect = (value: number | string) => {
    if (value === "custom") {
      setIsCustomMode(true);
      onSelect(Number(customValue));
    } else {
      setSelectedCredits(Number(value));
      onSelect(Number(value));
      setIsCustomMode(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {creditOptions.map(({ value, label }) => (
        <Button
          key={value}
          variant={selectedCredits === value ? "default" : "outline"}
          onClick={() => handleCreditSelect(value)}
          className="w-full"
        >
          {label}
        </Button>
      ))}
      <AnimatePresence mode="wait">
        {isCustomMode ? (
          <motion.div
            key="input"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
            className="relative"
          >
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "150%" }}
              transition={{ duration: 0.3 }}
              className="absolute z-10"
            >
              <Input
                type="number"
                placeholder="Enter amount"
                value={customValue}
                onChange={e => {
                  setCustomValue(e.target.value);
                  onSelect(Number(e.target.value));
                }}
                className="w-full"
                autoFocus
                onBlur={() => {
                  if (!customValue) {
                    setIsCustomMode(false);
                  }
                }}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              onClick={() => handleCreditSelect("custom")}
              className="h-full w-full"
            >
              Custom
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
