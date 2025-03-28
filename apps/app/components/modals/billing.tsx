"use client";

import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
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
import { Progress } from "@repo/design-system/components/ui/progress";
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
import { usePrivy } from "@/hooks/usePrivy";
export default function Billing() {
  const [selectedCredits, setSelectedCredits] = useState<null | number>(null);
  const [showBilling, setShowBilling] = React.useState(false);
  const { user } = usePrivy();
  const searchParams = useSearchParams();
  const billing = searchParams.get("billing");

  const router = useRouter();

  const handleClose = () => {
    setShowBilling(false);
    const { billing, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  const handleBuyCredits = () => {
    toast.success(`Added $${selectedCredits}`);
    setSelectedCredits(3000);
    handleClose();
  };

  useEffect(() => {
    setShowBilling(billing === "true");
    if (billing === "true") {
      track("billing_modal_opened", undefined, user || undefined);
    }
  }, [billing]);

  return (
    <AlertDialog open={showBilling} onOpenChange={setShowBilling}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-medium">Add Funds</AlertDialogTitle>
          <AlertDialogDescription>
            Funds are used to run pipelines. You can add more funds here. 1
            minute of ingest usage costs $0.01.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 ">
            <p className="font-medium text-md">Gateway Provider</p>
          </div>
          <div className="mt-2 mb-4">
            <Select defaultValue="livepeer">
              <SelectTrigger>
                <SelectValue placeholder="Select Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="livepeer">Livepeer Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <hr className="border-none " />
          <div className="flex items-center gap-2">
            <p className="font-medium text-md">Balance</p>
          </div>
          <div className="mt-3 ">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="font-medium text-lg">$200</span>
                <span className="text-foreground text-sm">left</span>
              </div>
              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                21 hours until next free funds top up
                <QuestionMarkCircledIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2">
              <Progress value={80} />
            </div>
            <div className="-mr-4 mt-2 flex flex-row items-center justify-end">
              <Button variant="link">View funds logs</Button>
            </div>
          </div>
          <hr className="mb-4 border-border border-t" />
          <div className="flex items-center gap-2">
            <p className="font-medium text-md">Add amount</p>
          </div>
          <div className="mt-3 h-[5.5rem]">
            <CreditSelection onSelect={setSelectedCredits} />
          </div>
        </div>

        <div className="mt-1 text-muted-foreground text-sm">
          🎉 For a limited time, please enjoy free usage subsidized by Livepeer.
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBuyCredits}
            disabled={selectedCredits === null || selectedCredits < 1}
          >
            Add ${selectedCredits}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const CreditSelection = ({
  onSelect,
}: {
  onSelect: (value: null | number) => void;
}) => {
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const creditOptions = [
    { value: 10, label: "$10" },
    { value: 50, label: "$50" },
    { value: 150, label: "$150" },
    { value: 500, label: "$500" },
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
