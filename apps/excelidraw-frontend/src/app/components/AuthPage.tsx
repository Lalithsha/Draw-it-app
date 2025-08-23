"use client";
import Input from "@repo/ui/components/Input2";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ThemeToggleButton } from "@repo/ui/components/theme-toggle";

interface BaseAuthProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface SignInProps extends BaseAuthProps {
  isSignIn: true;
  name: string;
  setName: (name: string) => void;
}

interface SignUpProps extends BaseAuthProps {
  isSignIn: false;
  name: string;
  setName: (name: string) => void;
}

export type AuthProps = (SignInProps | SignUpProps) & {
  error?: string;
  loading?: boolean;
};

export function AuthPage(props: AuthProps) {
  const {
    isSignIn,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    error,
    loading,
  } = props;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
          {isSignIn ? "Welcome Back!" : "Create Account"}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300">
          {isSignIn
            ? "Sign in to continue drawing."
            : "Sign up to start your creative journey."}
        </p>
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required={!isSignIn}
                placeholder="Your Name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out dark:bg-gray-800 dark:text-gray-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out dark:bg-gray-800 dark:text-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out dark:bg-gray-800 dark:text-gray-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={!!loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-60"
            >
              {loading ? "Please wait..." : isSignIn ? "Sign In" : "Sign Up"}
            </button>
          </div>
          {isSignIn ? (
            <div
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
              onClick={() => signIn("google")}
            >
              Sign in with google
            </div>
          ) : (
            <div
              className=" text-sm text-center text-gray-600 dark:text-gray-300 hover:text-indigo-500 cursor-pointer"
              onClick={() => signIn("google")}
            >
              Sign up with google
            </div>
          )}
        </form>
        <div className="text-sm text-center text-gray-600 dark:text-gray-300">
          {isSignIn ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
