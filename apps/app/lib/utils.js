"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLivepeerEmail = exports.sleep = void 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
exports.sleep = sleep;
const isLivepeerEmail = user => {
  if (!user) return false;
  const email =
    user.email?.address || user.google?.email || user.discord?.email;
  if (!email) return false;
  return email.endsWith("@livepeer.org");
};
exports.isLivepeerEmail = isLivepeerEmail;
