import { User } from "@privy-io/react-auth";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const isLivepeerEmail = (user: User | null | undefined): boolean => {
  if (!user) return false;

  const email =
    user.email?.address || user.google?.email || user.discord?.email;

  if (!email) return false;

  return email.endsWith("@livepeer.org");
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
