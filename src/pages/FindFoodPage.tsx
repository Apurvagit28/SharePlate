import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, X, SearchX } from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import { fetchListings } from '@/lib/api';
import { FOOD_CATEGORIES } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { FoodListing } from '@/types';

export default function FindFoodPage() {
  const [allListings, setAllListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('available');

  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await fetchListings();
      if (error) setError(error);
      if (data) setAllListings(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      // Status filter
      if (statusFilter === 'available') {
        const available = l.quantity - l.reserved_quantity;
        if (l.status !== 'available' || available <= 0) return false;
        if (new Date(l.availability_deadline).getTime() < Date.now()) return false;
      } else if (statusFilter === 'all') {
        // show everything
      } else if (statusFilter === 'accepted') {
        if (l.status !== 'accepted') return false;
      } else if (statusFilter === 'completed') {
        if (l.status !== 'completed') return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = l.food_name.toLowerCase().includes(q);
        const matchesLocation = l.pickup_location.toLowerCase().includes(q);
        const matchesDonor = l.donor_name.toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesDonor) return false;
      }

      return true;
    });
  }, [allListings, search, categoryFilter, statusFilter]);

  const hasActiveFilters = search.trim() || categoryFilter !== 'all' || statusFilter !== 'available';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('available');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Find Food</h1>
          <p className="text-stone-600">
            Browse available food donations near you. Search by name or location, and filter by category.
          </p>
          {isDemo && (
            <p className="text-sm text-amber-700 mt-3 bg-amber-50 inline-block px-4 py-1.5 rounded-full">
              Showing sample data — connect Supabase to see real listings.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search by food name, location, or donor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800"
              />
            </div>

            {/* Category */}
            <div className="lg:w-56">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800 bg-white"
              >
                <option value="all">All Categories</option>
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800 bg-white"
              >
                <option value="available">Available Only</option>
                <option value="all">All Statuses</option>
                <option value="accepted">Fully Reserved</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-stone-500 mb-4">
          {loading ? 'Loading...' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Content */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                <div className="h-4 bg-stone-200 rounded w-1/3 mb-4" />
                <div className="h-6 bg-stone-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-stone-200 rounded w-1/2 mb-6" />
                <div className="h-10 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <SearchX className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No listings found</h3>
            <p className="text-stone-500 mb-4">
              No food matches your current filters. Try adjusting your search or clearing filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l) => (
              <FoodCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
