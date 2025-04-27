"use client";
import { useState } from "react";
import { AuthPage } from "../components/AuthPage";
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  function onSubmit(e: React.FormEvent) {
    console.log({ email, password, name });
  }

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
      />
    </div>
  );
}
