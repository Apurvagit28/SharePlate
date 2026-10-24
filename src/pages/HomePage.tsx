import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  PackageCheck,
  UtensilsCrossed,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Users,
  Leaf,
  Clock,
  MapPin,
  Sparkles,
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
      icon: <UtensilsCrossed className="w-7 h-7" />,
      title: 'List Surplus Food',
      desc: 'Restaurants, hostels, grocery stores, and individuals post food they have to share.',
      color: 'bg-forest-100 text-forest-700',
    },
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Request What You Need',
      desc: 'Browse available listings and request the quantity you actually need.',
      color: 'bg-sage-100 text-sage-700',
    },
    {
      icon: <PackageCheck className="w-7 h-7" />,
      title: 'Complete the Handover',
      desc: 'Donors accept requests, arrange pickup, and mark the donation as completed.',
      color: 'bg-amber-100 text-amber-700',
    },
  ];

  const heroImage = 'https://images.pexels.com/photos/6646903/pexels-photo-6646903.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';
  const heroImage2 = 'https://images.pexels.com/photos/7156181/pexels-photo-7156181.jpeg?auto=compress&cs=tinysrgb&h=500&w=600';

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-sage-50 to-cream-100">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-forest-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-sage-200 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Leaf className="w-4 h-4" />
                Reducing food waste, together
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-800 leading-[1.1] mb-6 text-balance">
                Good Food Deserves a{' '}
                <span className="text-forest-600 italic">Second Chance.</span>
              </h1>
              <p className="text-lg md:text-xl text-stone-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Connecting surplus food with people who need it. Share what you can, take what you
                need, and help build a community where good food never goes to waste.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/donate-food"
                  className="inline-flex items-center justify-center gap-2 bg-forest-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-700 transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
                >
                  <HeartHandshake className="w-5 h-5" />
                  Donate Food
                </Link>
                <Link
                  to="/find-food"
                  className="inline-flex items-center justify-center gap-2 bg-white text-forest-700 border-2 border-forest-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-50 hover:border-forest-400 transition-all"
                >
                  <Search className="w-5 h-5" />
                  Explore Food
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="relative hidden lg:block animate-fade-in">
              <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
                <img
                  src={heroImage}
                  alt="Volunteers sharing food donations"
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 via-transparent to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card-hover p-5 w-56 border border-sage-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-stone-800 font-display">{stats.mealsRedistributed}</p>
                    <p className="text-xs text-stone-500">Meals redistributed</p>
                  </div>
                </div>
              </div>
              {/* Secondary image */}
              <div className="absolute -top-4 -right-4 w-40 h-40 rounded-2xl overflow-hidden shadow-card-hover border-4 border-cream-50">
                <img src={heroImage2} alt="Community volunteers" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Bar */}
      <section className="bg-forest-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <div className="text-center text-white">
              <p className="text-3xl md:text-5xl font-bold font-display">{stats.totalListings}</p>
              <p className="text-forest-200 text-sm md:text-base mt-1">Food Listings Created</p>
            </div>
            <div className="text-center text-white border-x border-forest-600/50">
              <p className="text-3xl md:text-5xl font-bold font-display">{stats.completedDonations}</p>
              <p className="text-forest-200 text-sm md:text-base mt-1">Completed Donations</p>
            </div>
            <div className="text-center text-white">
              <p className="text-3xl md:text-5xl font-bold font-display">{stats.mealsRedistributed}</p>
              <p className="text-forest-200 text-sm md:text-base mt-1">Meals Redistributed</p>
            </div>
          </div>
          {isDemo && (
            <p className="text-center text-forest-200/80 text-xs mt-6">
              Statistics reflect real database records and update as the community grows.
            </p>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <UtensilsCrossed className="w-4 h-4" />
            Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-3">How SharePlate Works</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Three simple steps to turn surplus food into a meal for someone who needs it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl p-8 shadow-card border border-stone-200/60 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 text-center group"
            >
              <div className="absolute top-6 right-6 text-5xl font-bold text-sage-100 font-display group-hover:text-sage-200 transition-colors">
                {i + 1}
              </div>
              <div className={`inline-flex items-center justify-center w-16 h-16 ${step.color} rounded-2xl mb-5`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">{step.title}</h3>
              <p className="text-stone-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Available Food Listings */}
      <section className="bg-gradient-to-b from-sage-50/50 to-cream-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-700 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
                <PackageCheck className="w-4 h-4" />
                Fresh Listings
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">Available Now</h2>
              <p className="text-stone-600">Food waiting to be claimed in your community.</p>
            </div>
            <Link
              to="/find-food"
              className="hidden sm:inline-flex items-center gap-1.5 text-forest-700 font-semibold hover:gap-2.5 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="h-44 shimmer-bg animate-shimmer" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-stone-100 rounded w-2/3 animate-pulse" />
                    <div className="h-4 bg-stone-100 rounded w-1/2 animate-pulse" />
                    <div className="h-10 bg-stone-100 rounded animate-pulse" />
                  </div>
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
            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
              <PackageCheck className="w-12 h-12 text-sage-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-700 mb-2">No listings available yet</h3>
              <p className="text-stone-500 mb-5">Be the first to share food with your community.</p>
              <Link
                to="/donate-food"
                className="inline-flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-forest-700 transition-colors"
              >
                <HeartHandshake className="w-5 h-5" />
                Donate Food
              </Link>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/find-food"
              className="inline-flex items-center gap-1.5 text-forest-700 font-semibold"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
            <img
              src="https://images.pexels.com/photos/6994855/pexels-photo-6994855.jpeg?auto=compress&cs=tinysrgb&h=600&w=800"
              alt="Volunteers organizing food donations"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-900/40 to-transparent" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Our Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">
              Making a Difference, One Meal at a Time
            </h2>
            <p className="text-stone-600 leading-relaxed mb-8">
              Every year, millions of tons of perfectly good food go to waste while people in our
              communities go hungry. SharePlate bridges that gap — connecting those who have surplus
              food with those who need it, one listing at a time.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-card border border-stone-200/60">
                <Users className="w-8 h-8 text-forest-600 mb-3" />
                <p className="text-2xl font-bold text-stone-800 font-display">{stats.totalListings}</p>
                <p className="text-sm text-stone-500">Active community members</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-card border border-stone-200/60">
                <MapPin className="w-8 h-8 text-sage-600 mb-3" />
                <p className="text-2xl font-bold text-stone-800 font-display">{stats.completedDonations}</p>
                <p className="text-sm text-stone-500">Completed handovers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Safety Banner */}
      <section className="bg-gradient-to-r from-forest-700 to-forest-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-white">
            <div className="w-14 h-14 rounded-2xl bg-forest-600/50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-bold mb-1">Food Safety First</h3>
              <p className="text-forest-200 leading-relaxed">
                Every listing includes allergen information, handling instructions, and pickup
                deadlines. Always verify food suitability before accepting. SharePlate does not
                inspect or certify food — accuracy depends on donors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-cream-50 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Start in minutes
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-stone-800 mb-6 text-balance">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
            Join SharePlate today. Whether you have surplus food to share or are looking for a meal,
            our community is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate-food"
              className="inline-flex items-center justify-center gap-2 bg-forest-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-700 transition-all shadow-glow hover:-translate-y-0.5"
            >
              <HeartHandshake className="w-5 h-5" />
              Donate Food
            </Link>
            <Link
              to="/find-food"
              className="inline-flex items-center justify-center gap-2 bg-white text-forest-700 border-2 border-forest-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-50 hover:border-forest-400 transition-all"
            >
              <Search className="w-5 h-5" />
              Find Food
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
