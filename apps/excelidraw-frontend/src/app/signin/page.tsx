"use client";

import { AuthPage } from "../components/AuthPage";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: email,
        password,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.href = "/";
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthPage
        isSignIn={true}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        name={"Sign In"}
        setName={() => {}}
        error={error ?? undefined}
        loading={loading}
      />
    </div>
  );
}
