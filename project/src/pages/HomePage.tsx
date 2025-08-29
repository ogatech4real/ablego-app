import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AboutSection from '../components/AboutSection';
import BookingPreview from '../components/BookingPreview';
import VehicleOwners from '../components/VehicleOwners';
import TechSafety from '../components/TechSafety';
import Testimonials from '../components/Testimonials';
import CallToAction from '../components/CallToAction';

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>AbleGo - Inclusive Transport with Compassion</title>
        <meta name="description" content="AbleGo provides safe, supportive transport services with trained companions for individuals with health challenges, disabilities, and vulnerabilities across the UK." />
        <meta property="og:title" content="AbleGo - Inclusive Transport with Compassion" />
        <meta property="og:description" content="Book safe, supportive rides with trained companions. From door to destination — we're with you." />
        <link rel="canonical" href="https://ablego.co.uk" />
      </Helmet>
      <Hero />
      <HowItWorks />
      <AboutSection />
      <BookingPreview />
      <VehicleOwners />
      <TechSafety />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default HomePage;