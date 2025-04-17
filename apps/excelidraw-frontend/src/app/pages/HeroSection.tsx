
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className="pattern-bg absolute inset-0 -z-10"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Bring Your Ideas to Life with 
              <span className="text-excali-purple font-handwritten ml-2">Draw-It-Out</span>
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              The simple, intuitive whiteboard tool that makes collaboration easy. Sketch, share, and brainstorm together in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-excali-purple hover:bg-purple-700 text-white px-8 py-6 text-lg">
                Start Drawing
                <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button variant="outline" className="border-excali-purple text-excali-purple hover:bg-excali-purple/10 px-8 py-6 text-lg">
                Watch Demo
              </Button>
            </div>
          </div>
          
          {/* Hero Image/Illustration */}
          <div className="relative">
            <div className="relative hand-drawn bg-white p-4 excali-shadow rounded-lg border-2 border-gray-200 animate-float">
              <div className="relative bg-white">
                <svg className="w-full h-full" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="400" fill="#F9FAFB" />
                  <path d="M100,100 Q150,50 200,150 T300,200 T400,250" stroke="#4A87FF" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="1000" className="animate-draw" />
                  <circle cx="200" cy="150" r="40" stroke="#FF7CAB" strokeWidth="2" fill="#FF7CAB" fillOpacity="0.2" strokeDasharray="1000" className="animate-draw" />
                  <rect x="350" y="200" width="100" height="80" stroke="#72CF9F" strokeWidth="2" fill="#72CF9F" fillOpacity="0.2" strokeDasharray="1000" className="animate-draw" />
                  <path d="M150,300 L250,280 L280,350" stroke="#FFC069" strokeWidth="2" fill="#FFC069" fillOpacity="0.2" strokeDasharray="1000" className="animate-draw" />
                  <text x="420" y="150" fontFamily="Caveat, cursive" fontSize="24" fill="#4A87FF">Notes</text>
                  <text x="130" y="250" fontFamily="Caveat, cursive" fontSize="24" fill="#9b87f5">Ideas</text>
                </svg>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-excali-yellow/20 rounded-full -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-excali-pink/20 rounded-full -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
