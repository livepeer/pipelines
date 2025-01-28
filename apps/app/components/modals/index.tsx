import Billing from "./billing";
import Gateway from "./gateway";
import HistoryPipelines from "./history";
import LikedPipelines from "./liked-pipeline";
import MyPipelines from "./my-pipelines";
import APIKeys from "./api-keys";

export default function Modals({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab;

  return (
    <>
      <Gateway />
      <Billing />
      {tab && (
        <div
          style={{
            boxShadow: "20px 0px 30px -15px rgba(0, 0, 0, 0.1)",
          }}
          className="fixed  left-0 top-[4rem] md:left-[15rem] md:top-[4rem] w-full md:w-[27rem] h-full bg-background border-r border-border overflow-y-auto z-20"
        >
          <LikedPipelines open={tab === "liked"} />
          <HistoryPipelines open={tab === "history"} />
          <MyPipelines open={tab === "my"} />
          <APIKeys open={tab === "api-keys"} />
        </div>
      )}
    </>
  );
}
