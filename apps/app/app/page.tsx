import Modals from "@/components/modals";
import Welcome from "@/components/welcome";
import type { Metadata } from "next";
import { type ReactElement, Suspense } from "react";
import FeaturedPipelines from "@/components/welcome/featured";
import { validateEnv } from "@/lib/env";
import {validateServerEnv} from "@/lib/serverEnv";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";

const App = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<ReactElement> => {
  validateEnv();
  await validateServerEnv();

  return (
    <div>
      <div className="flex-shrink-0">
        <Suspense>
          <Welcome />
        </Suspense>
      </div>
      <div className="min-h-0 flex-grow">
        <Suspense>
          <FeaturedPipelines />
        </Suspense>
      </div>
      <Modals searchParams={searchParams} />
      <ClientSideTracker eventName="home_page_view" />
    </div>
  );
};

export default App;
