import { getAppConfig, isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export const useAppConfig = () => {
  const searchParams = useSearchParams();
  const appConfig = useMemo(
    () =>
      getAppConfig(
        !isProduction() && searchParams?.get("gateway") === "secondary",
      ),
    [searchParams],
  );
  return appConfig;
};
