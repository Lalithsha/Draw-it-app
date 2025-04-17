
import React from 'react';

const testimonials = [
  {
    quote: "Draw-It-Out has transformed how our design team collaborates on new concepts. It's incredibly intuitive!",
    author: "Sarah J.",
    role: "UX Designer",
    company: "Designify",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    quote: "I use this tool daily for brainstorming and planning. The hand-drawn style makes my ideas feel more creative.",
    author: "Michael T.",
    role: "Product Manager",
    company: "TechStart",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    quote: "Teaching remotely became so much easier when I discovered Draw-It-Out. My students love the interactive whiteboard.",
    author: "Elena R.",
    role: "Science Educator",
    company: "Global Academy",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-gray-700">
            Join thousands of creative professionals who've transformed their workflow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg hand-drawn excali-shadow flex flex-col"
            >
              <div className="mb-6">
                <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.68 16.48C17.68 25.28 10.88 32 0.96 32V24.96C6.08 24.96 9.76 22.24 9.76 16.48H0.96V0H17.68V16.48ZM39.04 16.48C39.04 25.28 32.24 32 22.32 32V24.96C27.44 24.96 31.12 22.24 31.12 16.48H22.32V0H39.04V16.48Z" fill="#E9D8FD"/>
                </svg>
              </div>
              <p className="text-gray-700 mb-6 flex-grow">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="mr-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700">
            Join thousands of users already enjoying Draw-It-Out
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
