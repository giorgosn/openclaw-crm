"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA4_ID = "G-SFDKGVNMS4";

export function GA4Script() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    setHasConsent(consent === "accepted");

    const handleConsent = () => {
      const updated = localStorage.getItem("cookie-consent");
      setHasConsent(updated === "accepted");
    };

    window.addEventListener("cookie-consent-update", handleConsent);
    return () =>
      window.removeEventListener("cookie-consent-update", handleConsent);
  }, []);

  if (!hasConsent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`}
      </Script>
    </>
  );
}
