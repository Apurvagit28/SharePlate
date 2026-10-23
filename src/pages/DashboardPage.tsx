import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Inbox,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  fetchUserListings,
  fetchRequestsForUserListings,
  fetchUserRequests,
  fetchImpactStats,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ListingStatusBadge, RequestStatusBadge } from '@/components/StatusBadge';
import type { FoodListing, DonationRequest } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<DonationRequest[]>([]);
  const [myRequests, setMyRequests] = useState<DonationRequest[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, completedDonations: 0, mealsRedistributed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [listingsRes, incomingRes, myReqRes, statsRes] = await Promise.all([
        fetchUserListings(user.id),
        fetchRequestsForUserListings(user.id),
        fetchUserRequests(user.id),
        fetchImpactStats(),
      ]);
      if (listingsRes.error) {
        setError(listingsRes.error);
        setLoading(false);
        return;
      }
      if (listingsRes.data) setListings(listingsRes.data);
      if (incomingRes.data) setIncomingRequests(incomingRes.data);
      if (myReqRes.data) setMyRequests(myReqRes.data);
      if (statsRes.data) setStats(statsRes.data);
      setLoading(false);
    })();
  }, [user]);

  const activeListings = listings.filter(
    (l) => l.status === 'available' || l.status === 'accepted'
  );
  const completedDonations = listings.filter((l) => l.status === 'completed');
  const pendingIncoming = incomingRequests.filter((r) => r.status === 'pending');
  const acceptedIncoming = incomingRequests.filter((r) => r.status === 'accepted');

  const cards = [
    {
      label: 'My Food Listings',
      value: listings.length,
      icon: <Package className="w-6 h-6" />,
      color: 'green',
    },
    {
      label: 'Active Listings',
      value: activeListings.length,
      icon: <Clock className="w-6 h-6" />,
      color: 'amber',
    },
    {
      label: 'Incoming Requests',
      value: pendingIncoming.length + acceptedIncoming.length,
      icon: <Inbox className="w-6 h-6" />,
      color: 'blue',
    },
    {
      label: 'Completed Donations',
      value: completedDonations.length,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'green',
    },
  ];

  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-800 mb-1">Dashboard</h1>
              <p className="text-stone-600">
                Manage your donations, incoming requests, and food requests you've made.
              </p>
            </div>
            <Link
              to="/donate-food"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Donate Food
            </Link>
          </div>

          {isDemo && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Sample Mode</p>
                <p className="text-sm text-amber-800 mt-1">
                  Showing sample data because Supabase is not connected. Once connected with
                  authentication, this page will show only your own listings and requests.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            Error loading data: {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${colorMap[card.color]}`}>
                {card.icon}
              </div>
              <p className="text-3xl font-bold text-stone-800">{card.value}</p>
              <p className="text-sm text-stone-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Impact summary */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-lg font-bold">Community Impact</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold">{stats.totalListings}</p>
              <p className="text-green-100 text-sm">Total Listings</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.completedDonations}</p>
              <p className="text-green-100 text-sm">Completed Donations</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.mealsRedistributed}</p>
              <p className="text-green-100 text-sm">Meals Redistributed</p>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-bold text-stone-800">My Food Listings</h2>
          </div>
          {listings.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p>You haven't posted any listings yet.</p>
              <Link to="/donate-food" className="text-green-700 font-semibold mt-2 inline-block">
                Create your first listing →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500 text-left">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Food Name</th>
                    <th className="px-6 py-3 font-semibold">Available</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-stone-800">{l.food_name}</td>
                      <td className="px-6 py-3 text-stone-600">
                        {l.quantity - l.reserved_quantity} / {l.quantity} {l.unit}
                      </td>
                      <td className="px-6 py-3">
                        <ListingStatusBadge status={l.status} />
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          to={`/listing/${l.id}`}
                          className="inline-flex items-center gap-1 text-green-700 font-semibold hover:gap-2 transition-all"
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Incoming Requests (for my listings) */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-stone-800">Incoming Requests</h2>
          </div>
          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p>No requests for your listings yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500 text-left">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Requester</th>
                    <th className="px-6 py-3 font-semibold">Quantity</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {incomingRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-stone-800">{r.requester_name}</td>
                      <td className="px-6 py-3 text-stone-600">{r.requested_quantity}</td>
                      <td className="px-6 py-3 text-stone-600">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          to={`/listing/${r.listing_id}`}
                          className="inline-flex items-center gap-1 text-green-700 font-semibold hover:gap-2 transition-all"
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Requests (requests I've made) */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-stone-800">My Requests</h2>
          </div>
          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <Send className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p>You haven't requested any food yet.</p>
              <Link to="/find-food" className="text-green-700 font-semibold mt-2 inline-block">
                Browse available food →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500 text-left">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Quantity</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {myRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-stone-800">{r.requested_quantity}</td>
                      <td className="px-6 py-3 text-stone-600">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          to={`/listing/${r.listing_id}`}
                          className="inline-flex items-center gap-1 text-green-700 font-semibold hover:gap-2 transition-all"
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
