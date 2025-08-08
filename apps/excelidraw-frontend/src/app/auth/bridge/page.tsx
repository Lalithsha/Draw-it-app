"use client";
import { useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthBridge() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const email = params.get("email");
      const name = params.get("name");
      const redirect = params.get("redirect") || "/";
      if (!email) {
        router.replace("/signin");
        return;
      }
      try {
        await axios.post(
          `http://localhost:3001/api/v1/user/oauth/bridge`,
          { email, name },
          { withCredentials: true }
        );
        router.replace(redirect);
      } catch (e) {
        console.error("OAuth bridge failed", e);
        router.replace("/signin");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
