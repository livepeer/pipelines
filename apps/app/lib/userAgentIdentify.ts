export const identifyMobileInAppBrowser = (userAgent: string) => {
  const isWebView = /(wv|WebView)/i.test(userAgent);
  const isIOSWebView =
    /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent) ||
    /(iPhone|iPod|iPad).*WKWebView/i.test(userAgent);

  const isFacebook = /FBAN\/|FBAV\/|FB_IAB\/|FB4A\/|FBIOS/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  const isTwitter = /Twitter/i.test(userAgent);
  const isSnapchat = /Snapchat/i.test(userAgent);
  const isPinterest = /Pinterest/i.test(userAgent);
  const isLinkedIn = /LinkedIn/i.test(userAgent);
  const isTikTok = /musical_ly|TikTok/i.test(userAgent);

  const isGenericInApp =
    /Mobile\//i.test(userAgent) &&
    !/Safari\//i.test(userAgent) &&
    (isWebView || isIOSWebView);

  if (
    isFacebook ||
    isInstagram ||
    isTwitter ||
    isSnapchat ||
    isPinterest ||
    isLinkedIn ||
    isTikTok ||
    isGenericInApp ||
    isWebView ||
    isIOSWebView
  ) {
    return true;
  }

  if (
    (/android/i.test(userAgent) &&
      /Version\/\d+\.\d+/.test(userAgent) &&
      !/Chrome\/\d+\.\d+\.\d+\.\d+ Mobile Safari\/\d+\.\d+/.test(userAgent)) ||
    (/iphone|ipod|ipad/i.test(userAgent) &&
      /AppleWebKit\//i.test(userAgent) &&
      !/Safari\//i.test(userAgent))
  ) {
    return true;
  }

  return false;
};

export const identifyTikTokInAppBrowser = (userAgent: string) => {
  const isTikTok =
    userAgent?.includes("tiktok") ||
    userAgent?.includes("musical_ly") ||
    userAgent?.includes("bytedance");
  // Andriod tiktok is supported
  const isIphone = /iphone/i.test(userAgent);

  return isTikTok && isIphone;
};

export const identifyInstagramInAppBrowser = (userAgent: string) => {
  const isInstagram = /Instagram/i.test(userAgent);
  const isIphone = /iphone/i.test(userAgent);

  return isInstagram && isIphone;
};
