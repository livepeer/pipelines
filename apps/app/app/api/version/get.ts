"use server";

export default function getVersion(req, res) {
    res.status(200).json({
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    });
}
