import React from 'react';
import Hero from '../components/Hero';
import TechMarquee from '../components/TechMarquee';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import DevSDK from '../components/DevSDK';
import CTA from '../components/CTA';
import SectionRail from '../components/SectionRail';

const Home = () => {
  return (
    <>
      <SectionRail />
      <Hero />
      <TechMarquee />
      <HowItWorks />
      <Features />
      <DevSDK />
      <CTA />
    </>
  );
};

export default Home;
