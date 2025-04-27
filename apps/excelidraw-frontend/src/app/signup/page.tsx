"use client";
import { useState } from "react";
import { AuthPage } from "../components/AuthPage";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password, name });

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/user/signup",
        { username: email, password, name }
      );
      console.log("Sign-up successful:", response.data);
      window.location.href = "/signin"; // Redirect to sign-in after success
    } catch (error) {
      console.error("Sign-up error:", error);
      alert("Sign-up failed. Please try again.");
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
      />
    </div>
  );
}
