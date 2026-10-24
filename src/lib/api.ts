import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sampleListings, sampleRequests, sampleImpactStats } from '@/lib/sampleData';
import type {
  FoodListing,
  DonationRequest,
  NewListingInput,
  NewRequestInput,
  ListingStatus,
} from '@/types';

// ──────────────────────────────────────────────
// Listings
// ──────────────────────────────────────────────

export async function fetchListings(): Promise<{ data: FoodListing[] | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: sampleListings, error: null };
  }
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as FoodListing[], error: null };
}

export async function fetchListingById(
  id: string
): Promise<{ data: FoodListing | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const listing = sampleListings.find((l) => l.id === id);
    return { data: listing ?? null, error: null };
  }
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as FoodListing | null, error: null };
}

export async function fetchUserListings(
  userId: string
): Promise<{ data: FoodListing[] | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: sampleListings, error: null };
  }
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as FoodListing[], error: null };
}

export async function createListing(
  input: NewListingInput
): Promise<{ data: FoodListing | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const newListing: FoodListing = {
      id: `local-${Date.now()}`,
      ...input,
      additional_instructions: input.additional_instructions ?? null,
      donor_contact: input.donor_contact ?? null,
      status: 'available',
      reserved_quantity: 0,
      image_url: null,
      created_at: new Date().toISOString(),
      user_id: 'local-user',
    };
    sampleListings.unshift(newListing);
    return { data: newListing, error: null };
  }
  const { data, error } = await supabase
    .from('food_listings')
    .insert({
      ...input,
      additional_instructions: input.additional_instructions ?? null,
      donor_contact: input.donor_contact ?? null,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as FoodListing, error: null };
}

export async function updateListingStatus(
  id: string,
  status: ListingStatus
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const listing = sampleListings.find((l) => l.id === id);
    if (listing) listing.status = status;
    return { error: null };
  }
  const { error } = await supabase.from('food_listings').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

// ──────────────────────────────────────────────
// Requests
// ──────────────────────────────────────────────

export async function fetchRequestsForListing(
  listingId: string
): Promise<{ data: DonationRequest[] | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: sampleRequests.filter((r) => r.listing_id === listingId),
      error: null,
    };
  }
  const { data, error } = await supabase
    .from('donation_requests')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as DonationRequest[], error: null };
}

export async function fetchUserRequests(
  userId: string
): Promise<{ data: DonationRequest[] | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: sampleRequests, error: null };
  }
  const { data, error } = await supabase
    .from('donation_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as DonationRequest[], error: null };
}

export async function fetchRequestsForUserListings(
  userId: string
): Promise<{ data: DonationRequest[] | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: sampleRequests, error: null };
  }
  const { data, error } = await supabase
    .from('donation_requests')
    .select('*, food_listings!inner(user_id)')
    .eq('food_listings.user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as DonationRequest[], error: null };
}

export async function createRequest(
  input: NewRequestInput
): Promise<{ data: DonationRequest | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const newRequest: DonationRequest = {
      id: `local-req-${Date.now()}`,
      ...input,
      requester_contact: input.requester_contact ?? null,
      message: input.message ?? null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'local-user',
    };
    sampleRequests.unshift(newRequest);
    return { data: newRequest, error: null };
  }
  const { data, error } = await supabase
    .from('donation_requests')
    .insert({
      listing_id: input.listing_id,
      requested_quantity: input.requested_quantity,
      requester_name: input.requester_name,
      requester_contact: input.requester_contact ?? null,
      message: input.message ?? null,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as DonationRequest, error: null };
}

export async function acceptRequest(
  requestId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const req = sampleRequests.find((r) => r.id === requestId);
    if (!req) return { error: 'Request not found' };
    const listing = sampleListings.find((l) => l.id === req.listing_id);
    if (!listing) return { error: 'Listing not found' };
    const available = listing.quantity - listing.reserved_quantity;
    if (req.requested_quantity > available) {
      return { error: 'Not enough available quantity' };
    }
    listing.reserved_quantity += req.requested_quantity;
    if (listing.reserved_quantity >= listing.quantity) {
      listing.status = 'accepted';
    }
    req.status = 'accepted';
    return { error: null };
  }
  const { data, error } = await supabase.rpc('accept_donation_request', {
    p_request_id: requestId,
  });
  if (error) return { error: error.message };
  if (data && data.success === false) {
    return { error: data.error };
  }
  return { error: null };
}

export async function rejectRequest(
  requestId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const req = sampleRequests.find((r) => r.id === requestId);
    if (req) req.status = 'rejected';
    return { error: null };
  }
  const { error } = await supabase
    .from('donation_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
  return { error: error?.message ?? null };
}

export async function completeRequest(
  requestId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const req = sampleRequests.find((r) => r.id === requestId);
    if (req) req.status = 'completed';
    return { error: null };
  }
  const { error } = await supabase
    .from('donation_requests')
    .update({ status: 'completed' })
    .eq('id', requestId);
  return { error: error?.message ?? null };
}

export async function cancelRequest(
  requestId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const req = sampleRequests.find((r) => r.id === requestId);
    if (req) req.status = 'cancelled';
    return { error: null };
  }
  const { error } = await supabase
    .from('donation_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);
  return { error: error?.message ?? null };
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────

export async function fetchImpactStats(): Promise<{
  data: { totalListings: number; completedDonations: number; mealsRedistributed: number } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return { data: sampleImpactStats, error: null };
  }
  const { count: totalListings, error: e1 } = await supabase
    .from('food_listings')
    .select('*', { count: 'exact', head: true });
  if (e1) return { data: null, error: e1.message };

  const { count: completedDonations, error: e2 } = await supabase
    .from('donation_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  if (e2) return { data: null, error: e2.message };

  const { data: sumData, error: e3 } = await supabase
    .from('donation_requests')
    .select('requested_quantity')
    .eq('status', 'completed');
  if (e3) return { data: null, error: e3.message };

  const meals = (sumData as { requested_quantity: number }[] | null)?.reduce(
    (acc, r) => acc + Number(r.requested_quantity),
    0
  ) ?? 0;

  return {
    data: {
      totalListings: totalListings ?? 0,
      completedDonations: completedDonations ?? 0,
      mealsRedistributed: meals,
    },
    error: null,
  };
}
