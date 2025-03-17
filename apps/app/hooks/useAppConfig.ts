import { getAppConfig } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export const useAppConfig = () => {
  const searchParams = useSearchParams();
  const appConfig = useMemo(() => getAppConfig(searchParams), [searchParams]);
  return appConfig;
};
