import { Link } from 'react-router-dom';
import { MapPin, Clock, Tag, Package, AlertCircle } from 'lucide-react';
import type { FoodListing } from '@/types';
import { ListingStatusBadge } from '@/components/StatusBadge';

function formatDeadline(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return 'Expired';
  if (diffHrs < 1) return 'Less than 1 hour left';
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} left`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    'Cooked Meals': '🍲',
    'Produce': '🥬',
    'Bakery': '🥖',
    'Dairy': '🥛',
    'Beverages': '🥤',
    'Packaged': '📦',
    'Frozen': '🧊',
    'Other': '🍽️',
  };
  return map[category] ?? '🍽️';
}

export default function FoodCard({ listing }: { listing: FoodListing }) {
  const availableQty = listing.quantity - listing.reserved_quantity;
  const isExpired = new Date(listing.availability_deadline).getTime() < Date.now();
  const canRequest = listing.status === 'available' && availableQty > 0 && !isExpired;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Top color strip */}
      <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryIcon(listing.category)}</span>
            <div>
              <h3 className="font-bold text-stone-800 text-lg leading-tight">{listing.food_name}</h3>
              <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5" />
                {listing.category}
              </p>
            </div>
          </div>
          <ListingStatusBadge status={listing.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
          <p className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            <span>
              <strong>{availableQty}</strong> {listing.unit} left
              {listing.reserved_quantity > 0 && (
                <span className="text-stone-400"> / {listing.quantity} total</span>
              )}
            </span>
          </p>
          <p className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : ''}`}>
            <Clock className="w-4 h-4 text-green-600" />
            {formatDeadline(listing.availability_deadline)}
          </p>
        </div>

        <p className="text-sm text-stone-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          {listing.pickup_location}
        </p>

        {listing.allergen_info && (
          <p className="text-xs text-stone-500 flex items-start gap-1.5 bg-stone-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span><strong>Allergens:</strong> {listing.allergen_info}</span>
          </p>
        )}

        <div className="mt-auto pt-3">
          <Link
            to={`/listing/${listing.id}`}
            className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              canRequest
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
            }`}
          >
            View Details & Request
          </Link>
        </div>
      </div>
    </div>
  );
}
