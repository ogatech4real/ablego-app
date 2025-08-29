import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToTop } from '../utils/scrollUtils';
import { 
  Heart, 
  Users, 
  Target, 
  Award, 
  Lightbulb, 
  Shield,
  Mail,
  Linkedin
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us - AbleGo';
    scrollToTop('instant');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      // Animate team cards
      gsap.fromTo('.team-card',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: '.team-section',
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animate mission cards
      gsap.fromTo('.mission-card',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.mission-section',
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Floating background animations
      gsap.to('.floating-about-icon', {
        y: -12,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4
      });
    }
  }, []);

  const teamMembers = [
    {
      name: "Mi-careme Kumfa",
      description: "Mi-careme holds an MBA & MSc in FinTech. She leads AbleGo with visionary insight, blending tech, finance & care expertise to deliver inclusive, compassionate transport solutions.",
      image: "/Mi-careme Kumfa.jpg",
      linkedin: "https://www.linkedin.com/in/mi-careme-kumfa-3527bb2b9/",
      email: "micaremea@ablego.co.uk"
    },
    {
      name: "Adewale Ogabi",
      description: "Adewale is a Full Stack Developer & Automation Engineer bridging AI and IIoT to build smart, scalable systems in energy, health, and industrial tech. Driving digital transformation end-to-end.",
      image: "/Adewale Ogabi.jpg",
      linkedin: "https://www.linkedin.com/in/ogabiadewale/",
      email: "adewale@ablego.co.uk"
    },
    {
      name: "Omolabake Adegbite",
      description: "Omolabake is a compassionate Educator and Mathematician with 10+ years' experience, dedicated to inclusive innovation, accessibility, and empowering communities through people-centred solutions.",
      image: "/Omolabake Adegbite.jpg",
      linkedin: "https://www.linkedin.com/in/omolabake-adewumi-adegbite-53464a254/",
      email: "wumiade@ablego.co.uk"
    },
    {
      name: "Golden Bell",
      description: "Bell is British healthcare leader with a proven track record in care management, driving innovation and compassion at the heart of AbleGo's mission.",
      image: "/Golden Bell.png",
      linkedin: "https://www.linkedin.com/in/ablego-ventures-57a8ba378/",
      email: "bell@ablego.co.uk"
    }
  ];

  const missionPoints = [
    {
      icon: Heart,
      title: "Compassionate Care",
      description: "Every journey is treated with empathy, patience, and understanding of individual needs"
    },
    {
      icon: Shield,
      title: "Safety First",
      description: "Comprehensive safety protocols, trained staff, and real-time monitoring for peace of mind"
    },
    {
      icon: Users,
      title: "Inclusive Community",
      description: "Building a network where everyone has access to dignified, supportive transport"
    },
    {
      icon: Target,
      title: "Reliable Service",
      description: "Consistent, dependable transport solutions available 24/7 across the UK"
    }
  ];

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="relative py-20 overflow-hidden">
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/AbleGo_About_Us_Animation.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-600"></div>
        </video>
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
          <div className="floating-about-icon absolute top-20 left-20 text-white/20">
            <Heart className="w-8 h-8" />
          </div>
          <div className="floating-about-icon absolute top-40 right-24 text-white/20">
            <Users className="w-10 h-10" />
          </div>
          <div className="floating-about-icon absolute bottom-32 left-1/4 text-white/15">
            <Target className="w-6 h-6" />
          </div>
          <div className="floating-about-icon absolute bottom-20 right-1/3 text-white/20">
            <Shield className="w-7 h-7" />
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Heart className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="text-white">About AbleGo</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Mobility is dignity, and we're here to make sure no one is left behind.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-teal-600 mx-auto mb-8"></div>
            </div>

            <div className="prose prose-xl max-w-none">
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-8 md:p-12 shadow-lg border border-blue-100">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                  AbleGo is a UK-based on-demand transport service designed to support individuals with health challenges, 
                  disabilities, or anyone needing extra assistance when travelling. Whether it's a medical appointment, 
                  a social outing, or a daily errand, we go beyond just rides — we provide trusted, trained companions 
                  who ensure safety, comfort, and confidence from door to destination.
                </p>
                
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                  With both our own accessible vehicles and a network of verified partners, AbleGo gives you the freedom 
                  to book the right support for your journey — including professional support workers if needed.
                </p>
                
                <div className="bg-white rounded-2xl p-6 border-l-4 border-blue-600">
                  <p className="text-xl font-semibold text-gray-900 italic">
                    "We believe mobility is dignity, and we're here to make sure no one is left behind."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="mission-section py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Mission & Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything we do is guided by our commitment to accessible, dignified transport for all
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {missionPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="mission-card bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {point.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="team-section py-20 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="floating-about-icon absolute top-24 left-16 text-blue-200 opacity-30">
            <Users className="w-6 h-6" />
          </div>
          <div className="floating-about-icon absolute top-60 right-20 text-teal-200 opacity-30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="floating-about-icon absolute bottom-40 left-1/3 text-blue-200 opacity-25">
            <Award className="w-4 h-4" />
          </div>
          <div className="floating-about-icon absolute bottom-60 right-1/4 text-teal-200 opacity-30">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are a passionate, multidisciplinary team of Teesside University alumni, driven by empathy, innovation, and a shared commitment to improving lives through dignified mobility and smarter community-focused solutions.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Profile Image */}
                <div className="relative">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6 mt-4">
                    {member.description}
                  </p>

                  {/* Contact Links */}
                  <div className="flex items-center space-x-4">
                    <a
                      href={`mailto:${member.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors group"
                      aria-label={`Email ${member.name}`}
                    >
                      <Mail className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                    </a>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors group"
                      aria-label={`${member.name} on LinkedIn`}
                    >
                      <Linkedin className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Team Quote */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-3xl p-8 md:p-12 text-white max-w-4xl mx-auto">
              <blockquote className="text-2xl md:text-3xl font-bold mb-4 italic">
                "Together, we're building a future where transport isn't just functional — 
                it's humane, responsive, and empowering."
              </blockquote>
              <p className="text-blue-100 text-lg">
                — The AbleGo Leadership Team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Numbers that reflect our commitment to accessible transport
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600 font-medium">Active Partners</p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">10K+</div>
              <p className="text-gray-600 font-medium">Journeys Completed</p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
              <p className="text-gray-600 font-medium">Customer Satisfaction</p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <p className="text-gray-600 font-medium">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Want to Learn More?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Get in touch with our team to discuss partnerships, services, or how we can support your transport needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Our Team
            </a>
            <a 
              href="/book" 
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Book a Ride
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;