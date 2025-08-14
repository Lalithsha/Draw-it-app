"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../lib/api";
import { HTTP_BACKEND } from "../../../config";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing token");
  }, [token]);

  async function bridge() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`${HTTP_BACKEND}/guest/bridge`, {
        token,
        passcode: passcode || undefined,
      });
      const accessToken: string = res.data?.token;
      const roomId: string = res.data?.roomId;
      if (!accessToken || !roomId) {
        setError("Bridge failed");
        setLoading(false);
        return;
      }
      // Store guest access token for WS
      try {
        localStorage.setItem("guest_access_token", accessToken);
      } catch {}
      router.replace(`/canvas/${roomId}`);
    } catch (e) {
      console.log(e);
      setError("Invalid/expired link or passcode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-xl font-semibold">Join session</div>
        <div className="text-sm text-gray-500">
          {token ? "Enter passcode if the link is protected." : error}
        </div>
        <Input
          placeholder="Passcode (optional)"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
        <Button disabled={!token || loading} onClick={bridge}>
          {loading ? "Joining..." : "Join"}
        </Button>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  );
}
