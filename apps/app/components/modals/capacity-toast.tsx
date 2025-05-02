"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import track from "@/lib/track";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";
import { CapacityNotificationModal } from "./capacity-notification-modal";
import { useCapacityToastStore } from "@/hooks/useCapacityToast";

interface CapacityToastProps {
  path?: string;
  hasCapacity?: boolean;
  disabled?: boolean;
}

export function CapacityToast({
  path = "/",
  hasCapacity: hasCapacityProp,
  disabled = false,
}: CapacityToastProps) {
  const capacityCheck = useCapacityCheck();
  const { loading, hasCapacity } =
    hasCapacityProp !== undefined
      ? { loading: false, hasCapacity: hasCapacityProp }
      : capacityCheck;

  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasShownToast, markToastAsShown } = useCapacityToastStore();

  useEffect(() => {
    if (disabled || hasShownToast || loading || hasCapacity) {
      return;
    }

    toast(
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div>
            <p className="text-xs sm:text-sm font-semibold flex items-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 mr-1 mt-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.305908 14.4529L0.305908 17.5L3.2968 17.5L3.2968 14.4529L0.305908 14.4529ZM0.305908 7.39808L0.305908 10.4451L3.2968 10.4451L3.2968 7.39808L0.305908 7.39808ZM13.2147 7.39808L13.2147 10.4451L16.2056 10.4451L16.2056 7.39808L13.2147 7.39808ZM0.305908 3.54706L0.305907 0.499996L3.2968 0.499996L3.2968 3.54706L0.305908 3.54706ZM6.76031 6.91402L6.76031 3.86696L9.75121 3.86696L9.75121 6.91402L6.76031 6.91402ZM6.76031 10.9258L6.76031 13.9728L9.75121 13.9728L9.75121 10.9258L6.76031 10.9258Z"
                  fill="#2E2E2E"
                />
              </svg>
              Daydream is currently full
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">
              We can let you know when a spot is available
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className={cn(
            "flex-shrink-0 whitespace-nowrap alwaysAnimatedButton px-4 text-xs sm:text-sm",
          )}
          onClick={() => {
            track("capacity_get_notified_clicked", {
              path,
              minCapacity: searchParams.get("minCapacity") || "0",
            });
            setIsModalOpen(true);
          }}
        >
          Notify me
        </Button>
      </div>,
      {
        dismissible: false,
        duration: Infinity,
        position: "bottom-right",
        className:
          "capacity-toast-custom mx-auto px-3 sm:px-4 max-w-[calc(100vw-24px)] sm:max-w-md sm:-mb-7 sm:mr-12",
      },
    );

    markToastAsShown();

    track("capacity_toast_shown", {
      path,
      minCapacity: searchParams.get("minCapacity") || "0",
    });
  }, [
    loading,
    hasCapacity,
    searchParams,
    path,
    hasShownToast,
    disabled,
    markToastAsShown,
  ]);

  return (
    <CapacityNotificationModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
  );
}
