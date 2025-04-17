import React, { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const tabs = [
  {
    id: "sketching",
    title: "Sketching",
    content: (
      <div className="p-4 bg-white hand-drawn excali-shadow">
        <div className="bg-gray-50 rounded-lg p-4 aspect-video">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="600" height="400" fill="#F9FAFB" />
            <path
              d="M120,150 C180,80 250,250 350,200"
              stroke="#4A87FF"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M200,300 C250,280 280,250 350,270"
              stroke="#FF7CAB"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle
              cx="400"
              cy="150"
              r="30"
              stroke="#72CF9F"
              strokeWidth="2"
              fill="#72CF9F"
              fillOpacity="0.2"
            />
          </svg>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Free-form Sketching</h3>
          <p className="text-gray-700">
            Draw naturally with smooth, pressure-sensitive lines that feel like
            real pen on paper.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "collaboration",
    title: "Collaboration",
    content: (
      <div className="p-4 bg-white hand-drawn excali-shadow">
        <div className="bg-gray-50 rounded-lg p-4 aspect-video">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="600" height="400" fill="#F9FAFB" />
            <circle
              cx="150"
              cy="150"
              r="40"
              stroke="#4A87FF"
              strokeWidth="2"
              fill="#4A87FF"
              fillOpacity="0.2"
            />
            <rect
              x="300"
              y="120"
              width="120"
              height="80"
              stroke="#FF7CAB"
              strokeWidth="2"
              fill="#FF7CAB"
              fillOpacity="0.2"
            />
            <path
              d="M150,270 L300,250 L450,270"
              stroke="#FFC069"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="450"
              cy="150"
              r="40"
              stroke="#72CF9F"
              strokeWidth="2"
              fill="#72CF9F"
              fillOpacity="0.2"
            />
            <text
              x="130"
              y="150"
              fontFamily="Caveat, cursive"
              fontSize="16"
              fill="#4A87FF"
            >
              User 1
            </text>
            <text
              x="330"
              y="160"
              fontFamily="Caveat, cursive"
              fontSize="16"
              fill="#FF7CAB"
            >
              User 2
            </text>
            <text
              x="430"
              y="150"
              fontFamily="Caveat, cursive"
              fontSize="16"
              fill="#72CF9F"
            >
              User 3
            </text>
          </svg>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">
            Real-time Collaboration
          </h3>
          <p className="text-gray-700">
            Work together with your team in real-time, see changes as they
            happen instantly.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "sharing",
    title: "Sharing",
    content: (
      <div className="p-4 bg-white hand-drawn excali-shadow">
        <div className="bg-gray-50 rounded-lg p-4 aspect-video">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="600" height="400" fill="#F9FAFB" />
            <rect
              x="150"
              y="100"
              width="300"
              height="200"
              rx="8"
              stroke="#4A87FF"
              strokeWidth="2"
              fill="white"
            />
            <text
              x="280"
              y="170"
              fontFamily="Caveat, cursive"
              fontSize="24"
              fill="#9b87f5"
            >
              Share Link
            </text>
            <text
              x="220"
              y="210"
              fontFamily="system-ui"
              fontSize="14"
              fill="#4b5563"
            >
              https://draw-it-out.app/sketch/abc123
            </text>
            <rect
              x="220"
              y="230"
              width="160"
              height="30"
              rx="4"
              stroke="#72CF9F"
              strokeWidth="2"
              fill="#72CF9F"
              fillOpacity="0.2"
            />
            <text
              x="260"
              y="250"
              fontFamily="system-ui"
              fontSize="14"
              fill="#4b5563"
            >
              Copy Link
            </text>
          </svg>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
          <p className="text-gray-700">
            Share your drawings with a simple link or export to various formats
            for any use case.
          </p>
        </div>
      </div>
    ),
  },
];

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const nextTab = () => {
    setActiveTab((prev) => (prev === tabs.length - 1 ? 0 : prev + 1));
  };

  const prevTab = () => {
    setActiveTab((prev) => (prev === 0 ? tabs.length - 1 : prev - 1));
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See It in Action
          </h2>
          <p className="text-lg text-gray-700">
            Explore the powerful features that make Draw-It-Out the perfect tool
            for your visual thinking.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-2 mb-8">
          {tabs.map((tab, index) => (
            <Button
              key={tab.id}
              variant={activeTab === index ? "default" : "outline"}
              className={`${activeTab === index ? "bg-excali-purple text-white" : "text-gray-700 border-gray-300"}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.title}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto relative">
          <button
            className="absolute top-1/2 -translate-y-1/2 -left-6 md:-left-12 bg-white rounded-full p-2 shadow-lg text-gray-700 hover:text-excali-purple"
            onClick={prevTab}
          >
            <ChevronLeft />
          </button>

          {tabs[activeTab].content}

          <button
            className="absolute top-1/2 -translate-y-1/2 -right-6 md:-right-12 bg-white rounded-full p-2 shadow-lg text-gray-700 hover:text-excali-purple"
            onClick={nextTab}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
