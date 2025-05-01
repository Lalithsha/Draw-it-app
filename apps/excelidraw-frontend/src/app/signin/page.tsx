"use client";

import { AuthPage } from "../components/AuthPage";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });

    const result = await signIn("credentials", {
      redirect: false, // Handle redirect manually
      username: email,
      password,
      callbackUrl: "/canvas/1", // Redirect here on success
    });

    if (result?.error) {
      console.error("Sign-in error:", result.error);
      // Display error to user (e.g., via state or alert)
    } else {
      console.log("Sign-in successful:", result);
      // Redirect or update UI
      window.location.href = "/dashboard"; // Manual redirect if needed
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
      />
    </div>
  );
}
