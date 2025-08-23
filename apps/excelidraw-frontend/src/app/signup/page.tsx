"use client";
import { useState } from "react";
import { AuthPage } from "../components/AuthPage";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/user/signup",
        { username: email, password, name },
        { withCredentials: true }
      );
      if (!response?.data) throw new Error("No response");
      router.push("/signin");
    } catch (e: any) {
      const message =
        e?.response?.data?.message || "Sign-up failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthPage
        isSignIn={false}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={onSubmit}
        error={error ?? undefined}
        loading={loading}
      />
    </div>
  );
}
