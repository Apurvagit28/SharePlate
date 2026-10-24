import type { FoodListing } from '@/types';

const categoryImages: Record<string, string> = {
  'Cooked Meals': 'https://images.pexels.com/photos/12669168/pexels-photo-12669168.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Produce': 'https://images.pexels.com/photos/10539745/pexels-photo-10539745.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Bakery': 'https://images.pexels.com/photos/14520462/pexels-photo-14520462.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Dairy': 'https://images.pexels.com/photos/37377279/pexels-photo-37377279.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Beverages': 'https://images.pexels.com/photos/533355/pexels-photo-533355.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Packaged': 'https://images.pexels.com/photos/6647178/pexels-photo-6647178.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Frozen': 'https://images.pexels.com/photos/6653863/pexels-photo-6653863.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'Other': 'https://images.pexels.com/photos/6653863/pexels-photo-6653863.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
};

const categoryGradients: Record<string, string> = {
  'Cooked Meals': 'from-orange-400 to-amber-500',
  'Produce': 'from-green-400 to-emerald-500',
  'Bakery': 'from-amber-300 to-yellow-500',
  'Dairy': 'from-blue-300 to-sky-400',
  'Beverages': 'from-cyan-400 to-teal-500',
  'Packaged': 'from-stone-400 to-stone-500',
  'Frozen': 'from-sky-300 to-blue-400',
  'Other': 'from-sage-400 to-sage-500',
};

const defaultImage = categoryImages['Other'];
const defaultGradient = 'from-sage-400 to-forest-500';

export function getListingImage(listing: FoodListing): string {
  if (listing.image_url) return listing.image_url;
  return categoryImages[listing.category] ?? defaultImage;
}

export function getCategoryImage(category: string): string {
  return categoryImages[category] ?? defaultImage;
}

export function getCategoryGradient(category: string): string {
  return categoryGradients[category] ?? defaultGradient;
}
