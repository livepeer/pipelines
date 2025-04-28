import Script from "next/script";

export const ThirdPartyAnalytics = () => {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      {/* Hotjar */}
      <Script
        id="contentsquare"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
              (function (c, s, q, u, a, r, e) {
                  c.hj=c.hj||function(){(c.hj.q=c.hj.q||[]).push(arguments)};
                  c._hjSettings = { hjid: a };
                  r = s.getElementsByTagName('head')[0];
                  e = s.createElement('script'); e.async = true; e.src = q + c._hjSettings.hjid + u; r.appendChild(e);
              })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', ${process.env.NEXT_PUBLIC_HOTJAR_ID});
            `,
        }}
      />
      {/* Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                  page_path: window.location.pathname,
                });
              `,
        }}
      />
    </>
  );
};
