"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const previousPathRef = useRef<string>("");
  const isLoadingRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const startLoading = useCallback(() => {
    // Don't restart if already loading
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    clearTimers();
    setLoading(true);
    setProgress(0);

    // Start immediately
    requestAnimationFrame(() => {
      setProgress(10);
    });

    // Simulate progress with realistic timing (similar to YouTube)
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(50), 200);
    const timer3 = setTimeout(() => setProgress(70), 300);
    const timer4 = setTimeout(() => setProgress(85), 400);
    const timer5 = setTimeout(() => setProgress(95), 500);

    // Complete loading - wait longer to ensure visibility
    const timer6 = setTimeout(() => {
      setProgress(100);
      const timer7 = setTimeout(() => {
        setLoading(false);
        setProgress(0);
        isLoadingRef.current = false;
      }, 300);
      timersRef.current.push(timer7);
    }, 700);

    timersRef.current = [timer1, timer2, timer3, timer4, timer5, timer6];
  }, [clearTimers]);

  // Handle route changes
  useEffect(() => {
    const currentPath = `${pathname}${searchParams.toString()}`;

    // Initialize on first render
    if (previousPathRef.current === "") {
      previousPathRef.current = currentPath;
      return;
    }

    // Only trigger if path actually changed
    if (previousPathRef.current !== currentPath) {
      startLoading();
      previousPathRef.current = currentPath;
    }
  }, [pathname, searchParams, startLoading]);

  // Intercept link clicks for immediate feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");

      if (link && link instanceof HTMLAnchorElement && link.href) {
        try {
          const url = new URL(link.href);
          const currentUrl = window.location;

          // Only show loading for internal navigation
          const isInternal = url.origin === currentUrl.origin;
          const isNotBlank = link.target !== "_blank";
          const isNotDownload = !link.hasAttribute("download");
          const isDifferentPath =
            url.pathname + url.search !==
            currentUrl.pathname + currentUrl.search;

          if (isInternal && isNotBlank && isNotDownload && isDifferentPath) {
            // Start loading immediately on click
            startLoading();
          }
        } catch (e) {
          // Invalid URL, ignore
        }
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  if (!loading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] bg-transparent pointer-events-none z-[99999]"
    >
      <div
        className="h-full bg-blue-600"
        style={{
          width: `${progress}%`,
          height: "100%",
          boxShadow: "0 0 10px rgba(37, 99, 235, 0.5)",
          transition: "width 0.15s linear",
        }}
      />
    </div>
  );
}
