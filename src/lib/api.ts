import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sampleListings, sampleRequests, sampleImpactStats } from '@/lib/sampleData';
import type {
  FoodListing,
  DonationRequest,
  NewListingInput,
  NewRequestInput,
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

// Listing status is a protected column: clients cannot update it directly.
// It is changed only by the accept_donation_request / reject_donation_request /
// complete_donation_request SECURITY DEFINER functions, which verify ownership.

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

async function callRequestRpc(
  fn: 'accept_donation_request' | 'reject_donation_request' | 'complete_donation_request' | 'cancel_donation_request',
  requestId: string,
  sampleApply?: (req: DonationRequest, listing?: FoodListing) => { error: string | null }
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const req = sampleRequests.find((r) => r.id === requestId);
    if (!req) return { error: 'Request not found' };
    const listing = sampleListings.find((l) => l.id === req.listing_id);
    if (!listing) return { error: 'Listing not found' };
    if (sampleApply) return sampleApply(req, listing);
    return { error: null };
  }
  const { data, error } = await supabase.rpc(fn, { p_request_id: requestId });
  if (error) return { error: mapRpcError(error) };
  if (data && data.success === false) {
    return { error: data.error ?? 'Request could not be updated' };
  }
  return { error: null };
}

function mapRpcError(error: { message?: string; code?: string }): string {
  const msg = error.message ?? '';
  if (msg.includes('Not authenticated')) return 'You must be signed in to do that.';
  if (msg.includes('Not authorized')) return 'You are not allowed to do that.';
  if (msg.includes('not found')) return 'This request could not be found.';
  return 'Could not update the request. Please try again.';
}

export async function acceptRequest(
  requestId: string
): Promise<{ error: string | null }> {
  return callRequestRpc('accept_donation_request', requestId, (req, listing) => {
    const available = listing!.quantity - listing!.reserved_quantity;
    if (req.requested_quantity > available) {
      return { error: 'Not enough available quantity' };
    }
    listing!.reserved_quantity += req.requested_quantity;
    if (listing!.reserved_quantity >= listing!.quantity) {
      listing!.status = 'accepted';
    }
    req.status = 'accepted';
    return { error: null };
  });
}

export async function rejectRequest(
  requestId: string
): Promise<{ error: string | null }> {
  return callRequestRpc('reject_donation_request', requestId, (req) => {
    req.status = 'rejected';
    return { error: null };
  });
}

export async function completeRequest(
  requestId: string
): Promise<{ error: string | null }> {
  return callRequestRpc('complete_donation_request', requestId, (req) => {
    req.status = 'completed';
    return { error: null };
  });
}

export async function cancelRequest(
  requestId: string
): Promise<{ error: string | null }> {
  return callRequestRpc('cancel_donation_request', requestId, (req, listing) => {
    if (req.status === 'accepted') {
      listing!.reserved_quantity = Math.max(
        listing!.reserved_quantity - req.requested_quantity,
        0
      );
      if (listing!.reserved_quantity < listing!.quantity) {
        listing!.status = 'available';
      }
    }
    req.status = 'cancelled';
    return { error: null };
  });
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
  // Use the SECURITY INVOKER get_impact_stats() RPC so unauthenticated
  // visitors (anon) can see community-wide aggregates even though anon
  // has no SELECT on donation_requests. The function exposes only
  // counts, no row-level data.
  const { data, error } = await supabase.rpc('get_impact_stats');
  if (error) return { data: null, error: error.message };
  const stats = data as {
    total_listings: number;
    completed_donations: number;
    meals_redistributed: number;
  } | null;
  if (!stats) return { data: null, error: null };
  return {
    data: {
      totalListings: Number(stats.total_listings) ?? 0,
      completedDonations: Number(stats.completed_donations) ?? 0,
      mealsRedistributed: Number(stats.meals_redistributed) ?? 0,
    },
    error: null,
  };
}
