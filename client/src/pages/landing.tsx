import React from 'react';
import { Header } from '@/components/header';
import { HeroBanner } from '@/components/hero-banner';
import { RentalListings } from '@/components/rental-listings';
import { Footer } from '@/components/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroBanner />
      <RentalListings />
      <Footer />
    </main>
  );
}
