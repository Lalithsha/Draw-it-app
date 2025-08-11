"use client";
import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { api } from "./lib/api";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthHeaderSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

function AuthHeaderSync() {
  const { data: session } = useSession();
  useEffect(() => {
    const token = session?.accessToken;
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [session?.accessToken]);
  return null;
}
