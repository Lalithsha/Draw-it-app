import React, { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { api } from "@/app/lib/api";
import { useRouter } from "next/navigation";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Method to handle logout logic
  const handleLogout = async () => {
    try {
      await api.post(`http://localhost:3001/api/v1/user/logout`, {});
    } catch {}
    await signOut({ callbackUrl: "/" });
  };

  // Method to handle mobile logout (closes menu first)
  const handleMobileLogout = async () => {
    setIsMenuOpen(false);
    await handleLogout();
  };

  // Method to handle login (desktop)
  const handleLogin = () => {
    router.push("/signin");
  };

  // Method to handle login (mobile, closes menu first)
  const handleMobileLogin = () => {
    setIsMenuOpen(false);
    router.push("/signin");
  };

  return (
    <nav className="py-4 w-full sticky top-0 bg-white/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-excali-purple font-handwritten">
            Draw-It-Out
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-gray-600 hover:text-excali-purple transition duration-200"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-gray-600 hover:text-excali-purple transition duration-200"
          >
            How it Works
          </a>
          <a
            href="#testimonials"
            className="text-gray-600 hover:text-excali-purple transition duration-200"
          >
            Testimonials
          </a>
          {session ? (
            <Button
              className="bg-excali-purple hover:bg-purple-700 text-white ml-4"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              className="bg-excali-purple hover:bg-purple-700 text-white ml-4"
              onClick={handleLogin}
            >
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-excali-purple"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 z-50">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <a
              href="#features"
              className="text-gray-600 hover:text-excali-purple py-2 transition duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-excali-purple py-2 transition duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-excali-purple py-2 transition duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </a>
            {session ? (
              <Button
                className="bg-excali-purple hover:bg-purple-700 text-white w-full"
                onClick={handleMobileLogout}
              >
                Logout
              </Button>
            ) : (
              <Button
                className="bg-excali-purple hover:bg-purple-700 text-white w-full"
                onClick={handleMobileLogin}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
