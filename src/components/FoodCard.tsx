import { Link } from 'react-router-dom';
import { MapPin, Clock, Package, AlertCircle, ArrowRight } from 'lucide-react';
import type { FoodListing } from '@/types';
import { ListingStatusBadge } from '@/components/StatusBadge';
import { getListingImage, getCategoryGradient } from '@/lib/foodImages';

function formatDeadline(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return 'Expired';
  if (diffHrs < 1) return 'Less than 1 hour';
  if (diffHrs < 24) return `${diffHrs}h left`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d left`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function FoodCard({ listing }: { listing: FoodListing }) {
  const availableQty = listing.quantity - listing.reserved_quantity;
  const isExpired = new Date(listing.availability_deadline).getTime() < Date.now();
  const canRequest = listing.status === 'available' && availableQty > 0 && !isExpired;
  const imageUrl = getListingImage(listing);
  const gradient = getCategoryGradient(listing.category);

  return (
    <div className="group bg-white rounded-2xl shadow-card border border-stone-200/80 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
        <img
          src={imageUrl}
          alt={listing.food_name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <ListingStatusBadge status={listing.status} />
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <span className="text-2xl font-display font-semibold drop-shadow-lg">{listing.food_name}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-sm text-stone-500 flex items-center gap-1.5">
          <span className="font-medium text-stone-700">{listing.donor_name}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-stone-600">
            <Package className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span>
              <strong className="text-stone-800">{availableQty}</strong> {listing.unit}
              {listing.reserved_quantity > 0 && (
                <span className="text-stone-400"> / {listing.quantity}</span>
              )}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : 'text-stone-600'}`}>
            <Clock className={`w-4 h-4 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-forest-600'}`} />
            {formatDeadline(listing.availability_deadline)}
          </div>
        </div>

        <p className="text-sm text-stone-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-forest-600 mt-0.5 flex-shrink-0" />
          {listing.pickup_location}
        </p>

        {listing.allergen_info && listing.allergen_info.toLowerCase() !== 'none' && (
          <p className="text-xs text-stone-500 flex items-start gap-1.5 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span><strong>Allergens:</strong> {listing.allergen_info}</span>
          </p>
        )}

        <div className="mt-auto pt-3">
          <Link
            to={`/listing/${listing.id}`}
            className={`group/btn flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              canRequest
                ? 'bg-forest-600 text-white hover:bg-forest-700 shadow-soft'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
