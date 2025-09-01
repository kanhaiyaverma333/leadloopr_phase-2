"use client"
import Header from '@/components/marketing/components/Header';
import Hero from '@/components/marketing/components/Hero';
import TrustedBy from '@/components/marketing/components/TrustedBy';
import Features from '@/components/marketing/components/Features';
import Testimonials from '@/components/marketing/components/Testimonials';
import Pricing from '@/components/marketing/components/Pricing';
import CTA from '@/components/marketing/components/CTA';
import Footer from '@/components/marketing/components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen font-inter">
      <Header />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;