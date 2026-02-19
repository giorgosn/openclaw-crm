import Script from "next/script";

export function PlausibleScript() {
  return (
    <>
      <Script
        src="https://plausible.io/js/pa-NgffR9Cmf65xp81wiCACc.js"
        strategy="beforeInteractive"
      />
      <Script id="plausible-init" strategy="beforeInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();`}
      </Script>
    </>
  );
}
