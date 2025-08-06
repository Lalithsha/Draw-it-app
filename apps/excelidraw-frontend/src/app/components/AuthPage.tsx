import Input from "@repo/ui/components/Input2";
import { TurbopackRuleConfigItemOptions } from "next/dist/server/config-shared";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import Signup from "../signup/page";

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

export type AuthProps = SignInProps | SignUpProps;

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
  } = props;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          {isSignIn ? "Welcome Back!" : "Create Account"}
        </h2>
        <p className="text-center text-gray-600">
          {isSignIn
            ? "Sign in to continue drawing."
            : "Sign up to start your creative journey."}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {isSignIn ? "Sign In" : "Sign Up"}
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
              className=" text-sm text-center text-gray-600 hover:text-indigo-500 cursor-pointer 
            "
              onClick={() => Signup()}
            >
              Sign up with google
            </div>
          )}
        </form>
        <div className="text-sm text-center text-gray-600">
          {isSignIn ? (
            <>
              Don't have an account?{" "}
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
