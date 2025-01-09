export async function GET() {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "unknown";

  return new Response(
    `# HELP version Current version of the deployed api backend.
# TYPE version gauge
version{version="${commitSha}",app="pipelines-api",nodeversion="${process.version}",arch="${process.arch}",os="${process.platform}"} 1`,
    { status: 200 }
  );
}
