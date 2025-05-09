import StreamClient from "./StreamClient";

export default async function Stream({
  searchParams,
  params,
}: {
  searchParams: Promise<any>;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StreamClient streamInputId={id} searchParams={await searchParams} />;
}
