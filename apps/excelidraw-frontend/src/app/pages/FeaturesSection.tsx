
import React from 'react';
import { Paintbrush, Users, Share2, Lock, PencilRuler, Zap } from 'lucide-react';

const features = [
  {
    title: "Simple Drawing Tools",
    description: "Intuitive brush, shapes, and text tools that feel natural and responsive.",
    icon: Paintbrush,
    color: "bg-excali-blue/10",
    iconColor: "text-excali-blue"
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time, see changes as they happen.",
    icon: Users,
    color: "bg-excali-purple/10",
    iconColor: "text-excali-purple"
  },
  {
    title: "Easy Sharing",
    description: "Share your creations with a simple link or export to various formats.",
    icon: Share2,
    color: "bg-excali-green/10",
    iconColor: "text-excali-green"
  },
  {
    title: "Secure & Private",
    description: "Your drawings are encrypted and private by default. Control who can access them.",
    icon: Lock,
    color: "bg-excali-yellow/10",
    iconColor: "text-excali-yellow"
  },
  {
    title: "Precision Controls",
    description: "Advanced alignment, snapping, and measurement tools for precise diagrams.",
    icon: PencilRuler,
    color: "bg-excali-pink/10",
    iconColor: "text-excali-pink"
  },
  {
    title: "Lightning Fast",
    description: "Built for speed with instant loading and responsive performance.",
    icon: Zap,
    color: "bg-excali-blue/10",
    iconColor: "text-excali-blue"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features, Simple Interface
          </h2>
          <p className="text-lg text-gray-700">
            Everything you need to visualize your ideas without the complexity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg hand-drawn excali-shadow hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div className={`${feature.color} ${feature.iconColor} p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
