import React from "react";
import { Button } from "@repo/ui/components/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-excali-purple/90 to-excali-blue/90 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Bring Your Ideas to Life?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Start drawing, sketching, and collaborating today. No credit card
            required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-excali-purple hover:bg-gray-100 px-8 py-6 text-lg">
              Get Started for Free
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
            >
              See Plans
            </Button>
          </div>
          <p className="mt-6 text-white/70">
            Free plan includes 3 boards and basic collaboration features.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
