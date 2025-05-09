import MyStreamsClient from "./MyStreamsClient";

export default async function MyStreams({
  searchParams,
}: {
  searchParams: Promise<{ searchParams: any }>;
}) {
  return <MyStreamsClient searchParams={await searchParams} />;
}
