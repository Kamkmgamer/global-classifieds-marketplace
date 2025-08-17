"use client";

import { useEffect } from "react";
import * as ReactDOM from "react-dom";
import * as React from "react";

export default function AxeDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Only run in browser
    if (typeof window === "undefined") return;

    // Lazy import to avoid bundling in prod
    import("@axe-core/react")
      .then(({ default: axe }) => {
        try {
          axe(React, ReactDOM, 1000, { rules: [] });
          // eslint-disable-next-line no-console
          console.info("[a11y] axe-core/react initialized (dev only)");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[a11y] axe-core/react failed to initialize", e);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  return null;
}
