export type ListingStatus = 'available' | 'accepted' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export const FOOD_CATEGORIES = [
  'Cooked Meals',
  'Produce',
  'Bakery',
  'Dairy',
  'Beverages',
  'Packaged',
  'Frozen',
  'Other',
] as const;

export const FOOD_UNITS = [
  'meal packets',
  'kg',
  'portions',
  'boxes',
  'litres',
  'loaves',
  'servings',
  'items',
] as const;

export interface FoodListing {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  category: string;
  pickup_location: string;
  availability_deadline: string;
  handling_info: string;
  allergen_info: string;
  additional_instructions: string | null;
  donor_name: string;
  donor_contact: string | null;
  status: ListingStatus;
  reserved_quantity: number;
  image_url: string | null;
  created_at: string;
  user_id: string;
}

export interface DonationRequest {
  id: string;
  listing_id: string;
  requested_quantity: number;
  requester_name: string;
  requester_contact: string | null;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface FoodListingWithRequests extends FoodListing {
  requests: DonationRequest[];
}

export interface NewListingInput {
  food_name: string;
  quantity: number;
  unit: string;
  category: string;
  pickup_location: string;
  availability_deadline: string;
  handling_info: string;
  allergen_info: string;
  additional_instructions?: string | null;
  donor_name: string;
  donor_contact?: string | null;
}

export interface NewRequestInput {
  listing_id: string;
  requested_quantity: number;
  requester_name: string;
  requester_contact?: string | null;
  message?: string | null;
}
