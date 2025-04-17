
import React from 'react';
import { CheckCircle, FileDown, MousePointer, Share } from 'lucide-react';

const steps = [
  {
    title: "Create a New Board",
    description: "Start with a blank canvas or choose from templates for various use cases.",
    icon: CheckCircle,
    color: "text-excali-blue",
    bgColor: "bg-excali-blue/10"
  },
  {
    title: "Sketch Your Ideas",
    description: "Use intuitive drawing tools to visualize your thoughts and concepts.",
    icon: MousePointer,
    color: "text-excali-purple",
    bgColor: "bg-excali-purple/10"
  },
  {
    title: "Collaborate & Share",
    description: "Invite team members to collaborate in real-time or share your boards.",
    icon: Share,
    color: "text-excali-green",
    bgColor: "bg-excali-green/10"
  },
  {
    title: "Export & Use",
    description: "Export your creations in various formats or embed them in documents.",
    icon: FileDown,
    color: "text-excali-pink",
    bgColor: "bg-excali-pink/10"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-700">
            From idea to visualization in just a few simple steps.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className={`${step.bgColor} ${step.color} w-16 h-16 flex items-center justify-center rounded-full mb-6`}>
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {/* Connector line for all except the last item */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute mt-8 transform translate-x-[9rem]">
                    <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 12H42" stroke="#CBD5E0" strokeWidth="2" strokeDasharray="4 4"/>
                      <path d="M42 12L32 6V18L42 12Z" fill="#CBD5E0"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
