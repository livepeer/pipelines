import { NextRequest } from "next/server";
import { verifyAdminAccess } from "./auth";

export async function validateAdminRequest(request: NextRequest) {
  const auth = await verifyAdminAccess(request);

  if (!auth.authorized) {
    return {
      valid: false,
      error: auth.error,
      status: auth.status,
    };
  }

  return {
    valid: true,
    user: auth.user,
  };
}
