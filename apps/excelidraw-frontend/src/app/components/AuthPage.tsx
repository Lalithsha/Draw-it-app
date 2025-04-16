"use client";

export function AuthPage({ isSignIn }: { isSignIn: boolean }) {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center ">
      <div className="m-2 p-2 bg-white rounded-md shadow-md text-gray-800 w-96 ">
        <div className="w-full p-2 border border-gray-300 rounded-md my-2">
          <input type="email" placeholder="Email" className="w-full px-2" />
        </div>
        <div className="w-full p-2 border border-gray-300 rounded-md my-2">
          <input
            type="password"
            placeholder="Password"
            className="w-full items-center px-2"
          />
        </div>
        <div className="pt-2">
          <button
            onClick={() => {}}
            className="rounded-md bg-blue-500 text-white p-2 w-full"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
