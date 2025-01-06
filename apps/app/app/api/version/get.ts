"use server";

import type { NextApiRequest, NextApiResponse } from 'next';

export default function getVersion(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    });
}
