"use client";

import { useState, useEffect } from "react";

/**
 * Hook to safely access client-side values without causing hydration mismatches
 * @param getValue Function that returns the client-side value
 * @param defaultValue Default value to use during SSR
 * @returns The client-side value once mounted, or the default value during SSR
 */
export function useClient<T>(
  getValue: () => T,
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(defaultValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setValue(getValue());
  }, [getValue]);

  return isClient ? value : defaultValue;
}

/**
 * Hook to get window.location.origin safely
 */
export function useOrigin(): string {
  return useClient(() => window.location.origin, "");
}

/**
 * Hook to check if we're on the client side
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}

/**
 * Hook to get window dimensions safely
 */
export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return isClient ? dimensions : { width: 0, height: 0 };
}

/**
 * Client-safe redirect function
 */
export function clientRedirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
