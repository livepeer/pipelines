"use client";

import { useState, useEffect } from "react";

interface ClientInfo {
  userAgent: string;
  isTikTok: boolean;
  language?: string;
  languages?: readonly string[];
  platform?: string;
  vendor?: string;
  cookieEnabled?: boolean;
  onLine?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  screenColorDepth?: number;
  screenPixelDepth?: number;
  windowInnerWidth?: number;
  windowInnerHeight?: number;
  windowOuterWidth?: number;
  windowOuterHeight?: number;
  devicePixelRatio?: number;
  timezoneOffset?: number;
  localTime?: string;
  connection?:
    | {
        effectiveType?: string;
        rtt?: number;
        downlink?: number;
        saveData?: boolean;
      }
    | string;
  cookies?: string;
  localStorageEnabled?: boolean;
  sessionStorageEnabled?: boolean;
}

function isTikTokInAppBrowser(userAgent: string): boolean {
  return /TikTok/i.test(userAgent);
}

export default function ClientInfoDisplay() {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const nav = navigator as any;

      const info: ClientInfo = {
        userAgent: ua,
        isTikTok: isTikTokInAppBrowser(ua),
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        vendor: navigator.vendor,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenWidth: window.screen?.width,
        screenHeight: window.screen?.height,
        screenAvailWidth: window.screen?.availWidth,
        screenAvailHeight: window.screen?.availHeight,
        screenColorDepth: window.screen?.colorDepth,
        screenPixelDepth: window.screen?.pixelDepth,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        windowOuterWidth: window.outerWidth,
        windowOuterHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        timezoneOffset: new Date().getTimezoneOffset(),
        localTime: new Date().toLocaleString(),
        cookies: document.cookie || "N/A",
      };

      // navigator.connection (NetworkInformation API)
      if (nav.connection) {
        info.connection = {
          effectiveType: nav.connection.effectiveType,
          rtt: nav.connection.rtt,
          downlink: nav.connection.downlink,
          saveData: nav.connection.saveData,
        };
      } else {
        info.connection = "N/A or not supported";
      }

      // LocalStorage & SessionStorage
      try {
        localStorage.setItem("__test__", "__test__");
        localStorage.removeItem("__test__");
        info.localStorageEnabled = true;
      } catch (e) {
        info.localStorageEnabled = false;
      }

      try {
        sessionStorage.setItem("__test__", "__test__");
        sessionStorage.removeItem("__test__");
        info.sessionStorageEnabled = true;
      } catch (e) {
        info.sessionStorageEnabled = false;
      }

      setClientInfo(info);
      setIsLoading(false);
    }
  }, []);

  if (!clientInfo) {
    return (
      <p style={{ fontFamily: "monospace", padding: "20px", color: "red" }}>
        No info
      </p>
    );
  }

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "20px",
        lineHeight: "1.6",
        fontSize: "14px",
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        margin: "10px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          borderBottom: "1px solid #aaa",
          paddingBottom: "10px",
        }}
      >
        📱 Client information 🕵️
      </h2>
      {Object.entries(clientInfo).map(([key, value]) => (
        <div
          key={key}
          style={{
            marginBottom: "8px",
            padding: "5px",
            borderBottom: "1px dotted #ddd",
          }}
        >
          <strong
            style={{
              color: "#333",
              minWidth: "180px",
              display: "inline-block",
            }}
          >
            {key}:
          </strong>
          <span style={{ color: "#555" }}>
            {typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) ? (
              <pre
                style={{
                  margin: 0,
                  display: "inline-block",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : Array.isArray(value) ? (
              `[${value.join(", ")}]`
            ) : (
              String(value)
            )}
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "10px",
          borderTop: "1px solid #aaa",
        }}
      >
        <p>
          <strong>
            🚨 isTikTok: {clientInfo.isTikTok ? "✔️ Yes (TikTok)" : "❌ No"}
          </strong>
        </p>
      </div>
    </div>
  );
}
