"use client";
/* import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@repo/ui/components/tooltip";
// import { Toaster } from "@/components/ui/toaster";
import { Toaster } from "@repo/ui/components/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@repo/ui/components/sonner";

// Create a new QueryClient instance
const queryClient = new QueryClient(); */

import React from "react";
import NavBar from "./components/NavBar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import DemoSection from "./components/DemoSection";
import HowItWorks from "./components/HowItWorks";
import TestimonialsSection from "./components/TestimonialsSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    // <QueryClientProvider client={queryClient}>
    //   <TooltipProvider>
    //     <Toaster />
    //     <Sonner />
    //   </TooltipProvider>
    // </QueryClientProvider>
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DemoSection />
        <HowItWorks />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
