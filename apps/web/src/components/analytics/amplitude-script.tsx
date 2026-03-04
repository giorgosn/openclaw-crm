"use client";

import { useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

export function AmplitudeScript() {
  useEffect(() => {
    if (AMPLITUDE_API_KEY) {
      amplitude.init(AMPLITUDE_API_KEY, {
        autocapture: { elementInteractions: false },
      });
    }
  }, []);

  return null;
}
