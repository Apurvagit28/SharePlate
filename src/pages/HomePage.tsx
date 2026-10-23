import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  PackageCheck,
  Truck,
  UtensilsCrossed,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Users,
  Leaf,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import FoodCard from '@/components/FoodCard';
import { fetchListings, fetchImpactStats } from '@/lib/api';
import type { FoodListing } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function HomePage() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, completedDonations: 0, mealsRedistributed: 0 });
  const [loadingListings, setLoadingListings] = useState(true);
  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    (async () => {
      const { data } = await fetchListings();
      if (data) setListings(data.slice(0, 6));
      setLoadingListings(false);

      const { data: statsData } = await fetchImpactStats();
      if (statsData) setStats(statsData);
    })();
  }, []);

  const steps = [
    {
      icon: <UtensilsCrossed className="w-8 h-8" />,
      title: '1. List Surplus Food',
      desc: 'Restaurants, hostels, grocery stores, and individuals post food they have to share.',
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: '2. Request What You Need',
      desc: 'Browse available listings and request the quantity you actually need.',
    },
    {
      icon: <PackageCheck className="w-8 h-8" />,
      title: '3. Complete the Handover',
      desc: 'Donors accept requests, arrange pickup, and mark the donation as completed.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-50 via-cream-50 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              Reducing food waste, together
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-stone-800 leading-tight mb-6">
              Good Food Deserves a{' '}
              <span className="text-green-600">Second Chance.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed mb-8">
              Connecting surplus food with people who need it. Share what you can, take what you
              need, and help build a community where good food never goes to waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/donate-food"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                <HeartHandshake className="w-5 h-5" />
                Donate Food
              </Link>
              <Link
                to="/find-food"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 border-2 border-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Find Food
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-3">How SharePlate Works</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Three simple steps to turn surplus food into a meal for someone who needs it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200 hover:shadow-md transition-shadow text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-700 rounded-2xl mb-5">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">{step.title}</h3>
              <p className="text-stone-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Available Food Listings */}
      <section className="bg-stone-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">Available Now</h2>
              <p className="text-stone-600">Fresh listings waiting to be claimed.</p>
            </div>
            <Link
              to="/find-food"
              className="hidden sm:inline-flex items-center gap-1 text-green-700 font-semibold hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-4" />
                  <div className="h-6 bg-stone-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-stone-200 rounded w-1/2 mb-6" />
                  <div className="h-10 bg-stone-200 rounded" />
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => (
                <FoodCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <p className="text-center text-stone-500 py-12">No listings available yet.</p>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/find-food"
              className="inline-flex items-center gap-1 text-green-700 font-semibold"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Our Impact
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800">
            Making a Difference, One Meal at a Time
          </h2>
          {isDemo && (
            <p className="text-sm text-amber-700 mt-3 bg-amber-50 inline-block px-4 py-1.5 rounded-full">
              Statistics shown are demonstration data — they will update from real records once Supabase is connected.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-200">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 text-green-700 rounded-xl mb-4">
              <PackageCheck className="w-7 h-7" />
            </div>
            <p className="text-4xl font-bold text-stone-800">{stats.totalListings}</p>
            <p className="text-stone-600 mt-1">Food Listings Created</p>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-200">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-700 rounded-xl mb-4">
              <Truck className="w-7 h-7" />
            </div>
            <p className="text-4xl font-bold text-stone-800">{stats.completedDonations}</p>
            <p className="text-stone-600 mt-1">Completed Donations</p>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-200">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 text-amber-700 rounded-xl mb-4">
              <Users className="w-7 h-7" />
            </div>
            <p className="text-4xl font-bold text-stone-800">{stats.mealsRedistributed}</p>
            <p className="text-stone-600 mt-1">Meals Redistributed</p>
          </div>
        </div>
      </section>

      {/* Food Safety Banner */}
      <section className="bg-green-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-white">
            <ShieldCheck className="w-12 h-12 flex-shrink-0" />
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-1">Food Safety First</h3>
              <p className="text-green-100">
                Every listing includes allergen information, handling instructions, and pickup
                deadlines. Always verify food suitability before accepting. SharePlate does not
                inspect or certify food — accuracy depends on donors.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
