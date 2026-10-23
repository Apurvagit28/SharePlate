import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Tag,
  Package,
  AlertCircle,
  ShieldCheck,
  Send,
  CheckCircle2,
  Users,
  MessageSquare,
  Flag,
  XCircle,
  PackageCheck,
  Loader2,
  LogIn,
  Ban,
} from 'lucide-react';
import {
  fetchListingById,
  fetchRequestsForListing,
  createRequest,
  acceptRequest,
  rejectRequest,
  completeRequest,
  cancelRequest,
} from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ListingStatusBadge, RequestStatusBadge } from '@/components/StatusBadge';
import type { FoodListing, DonationRequest } from '@/types';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request form state
  const [reqQty, setReqQty] = useState('');
  const [reqName, setReqName] = useState('');
  const [reqContact, setReqContact] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [reqErrors, setReqErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isDemo = !isSupabaseConfigured;
  const { user } = useAuth();
  const navigate = useNavigate();

  const isListingOwner = Boolean(user && listing && listing.user_id === user.id);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    const { data: listingData, error: listingErr } = await fetchListingById(id);
    if (listingErr) {
      setError(listingErr);
      setLoading(false);
      return;
    }
    setListing(listingData);
    const { data: reqData } = await fetchRequestsForListing(id);
    if (reqData) setRequests(reqData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const availableQty = listing ? listing.quantity - listing.reserved_quantity : 0;
  const isExpired = listing ? new Date(listing.availability_deadline).getTime() < Date.now() : false;
  const canRequest = listing?.status === 'available' && availableQty > 0 && !isExpired;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/auth', { state: { from: `/listing/${id}` } });
      return;
    }

    setReqErrors({});
    setReqError(null);

    const errs: Record<string, string> = {};
    if (!reqQty || Number(reqQty) <= 0) errs.qty = 'Quantity must be a positive number';
    else if (Number(reqQty) > availableQty) errs.qty = `Only ${availableQty} ${listing?.unit} available`;
    if (!reqName.trim()) errs.name = 'Your name is required';

    if (Object.keys(errs).length > 0) {
      setReqErrors(errs);
      return;
    }

    setSubmitting(true);
    const { error } = await createRequest({
      listing_id: id!,
      requested_quantity: Number(reqQty),
      requester_name: reqName.trim(),
      requester_contact: reqContact.trim() || null,
      message: reqMessage.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      setReqError(error);
      return;
    }

    setReqSuccess(true);
    setReqQty('');
    setReqName('');
    setReqContact('');
    setReqMessage('');
    await loadAll();
  };

  const handleAccept = async (reqId: string) => {
    setActionError(null);
    const { error } = await acceptRequest(reqId);
    if (error) {
      setActionError(error);
      return;
    }
    await loadAll();
  };

  const handleReject = async (reqId: string) => {
    setActionError(null);
    const { error } = await rejectRequest(reqId);
    if (error) {
      setActionError(error);
      return;
    }
    await loadAll();
  };

  const handleComplete = async (reqId: string) => {
    setActionError(null);
    const { error } = await completeRequest(reqId);
    if (error) {
      setActionError(error);
      return;
    }
    await loadAll();
  };

  const handleCancel = async (reqId: string) => {
    setActionError(null);
    const { error } = await cancelRequest(reqId);
    if (error) {
      setActionError(error);
      return;
    }
    await loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-800 mb-2">
            {error ? 'Something went wrong' : 'Listing not found'}
          </h2>
          <p className="text-stone-500 mb-4">{error ?? 'This food listing may have been removed.'}</p>
          <Link to="/find-food" className="inline-flex items-center gap-2 text-green-700 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Find Food
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/find-food" className="inline-flex items-center gap-2 text-stone-600 hover:text-green-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Find Food
        </Link>

        {isDemo && (
          <p className="text-sm text-amber-700 mb-4 bg-amber-50 inline-block px-4 py-1.5 rounded-full">
            Sample mode — data won't persist between sessions until Supabase is connected.
          </p>
        )}

        {/* Main Listing Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800">{listing.food_name}</h1>
                <p className="text-stone-500 mt-1">Posted by {listing.donor_name}</p>
              </div>
              <ListingStatusBadge status={listing.status} />
            </div>

            {/* Key info grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                <Package className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Available</p>
                  <p className="font-semibold text-stone-800">{availableQty} {listing.unit}</p>
                  {listing.reserved_quantity > 0 && (
                    <p className="text-xs text-stone-400">{listing.reserved_quantity} reserved / {listing.quantity} total</p>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-xl p-4 ${isExpired ? 'bg-red-50' : 'bg-stone-50'}`}>
                <Clock className={`w-5 h-5 flex-shrink-0 ${isExpired ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-xs text-stone-500">Pickup Deadline</p>
                  <p className={`font-semibold ${isExpired ? 'text-red-700' : 'text-stone-800'}`}>
                    {new Date(listing.availability_deadline).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {isExpired && <p className="text-xs text-red-600">This listing has expired</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                <Tag className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Category</p>
                  <p className="font-semibold text-stone-800">{listing.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Pickup Location</p>
                  <p className="font-semibold text-stone-800">{listing.pickup_location}</p>
                </div>
              </div>
            </div>

            {/* Handling & Allergen info */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  Food Handling Information
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">{listing.handling_info}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5" />
                  Allergen Information
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">{listing.allergen_info}</p>
              </div>

              {listing.additional_instructions && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-1">
                    <MessageSquare className="w-5 h-5" />
                    Additional Instructions
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{listing.additional_instructions}</p>
                </div>
              )}
            </div>

            {/* Report listing */}
            <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Always verify food suitability before accepting. SharePlate does not inspect or certify food.
              </p>
              <button
                onClick={() => alert('Report submitted. Our team will review this listing.')}
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-stone-800 mb-1 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            Request This Food
          </h2>
          <p className="text-stone-500 text-sm mb-5">
            Enter the quantity you need and your details. The donor will review your request.
          </p>

          {reqSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Request submitted!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your request has been sent. You can track its status below.
                  {isDemo && ' (Sample mode — request stored only in this session.)'}
                </p>
                <button
                  onClick={() => setReqSuccess(false)}
                  className="mt-3 text-sm text-green-700 font-semibold hover:underline"
                >
                  Make another request
                </button>
              </div>
            </div>
          ) : !canRequest ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
              <p className="text-stone-600">
                {isExpired
                  ? 'This listing has expired and is no longer accepting requests.'
                  : listing.status === 'accepted'
                  ? 'All available quantity has been reserved.'
                  : 'This listing is not accepting new requests.'}
              </p>
            </div>
          ) : !user ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex items-center justify-between gap-4 flex-col sm:flex-row">
              <p className="text-stone-600 text-sm">
                Sign in to request this food donation.
              </p>
              <button
                onClick={() => navigate('/auth', { state: { from: `/listing/${id}` } })}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              {reqError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                  {reqError}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Quantity Needed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={availableQty}
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    placeholder={`Max ${availableQty} ${listing.unit}`}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
                      reqErrors.qty
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                    } text-stone-800`}
                  />
                  {reqErrors.qty && <p className="text-red-500 text-sm mt-1">{reqErrors.qty}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="e.g. City Shelter"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
                      reqErrors.name
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                    } text-stone-800`}
                  />
                  {reqErrors.name && <p className="text-red-500 text-sm mt-1">{reqErrors.name}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Contact <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reqContact}
                  onChange={(e) => setReqContact(e.target.value)}
                  placeholder="Phone or email so the donor can reach you"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Message <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  rows={2}
                  placeholder="Tell the donor about your need..."
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Requests for this listing */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-stone-800 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Requests for This Listing
          </h2>
          <p className="text-stone-500 text-sm mb-5">
            {isListingOwner
              ? 'As the donor, you can accept, reject, or complete requests here.'
              : 'Requests made for this listing are shown below.'}
          </p>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
              {actionError}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p>No requests yet for this listing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-stone-800">{req.requester_name}</span>
                      <RequestStatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-stone-600">
                      Requesting <strong>{req.requested_quantity} {listing.unit}</strong>
                      {req.requester_contact && ` · ${req.requester_contact}`}
                    </p>
                    {req.message && (
                      <p className="text-sm text-stone-500 mt-1 italic">"{req.message}"</p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap">
                      {isListingOwner && (
                        <>
                          <button
                            onClick={() => handleAccept(req.id)}
                            className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="inline-flex items-center gap-1.5 bg-white text-red-600 border border-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {user && req.user_id === user.id && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="inline-flex items-center gap-1.5 bg-white text-stone-600 border border-stone-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-50 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <div className="flex gap-2 flex-wrap">
                      {isListingOwner && (
                        <button
                          onClick={() => handleComplete(req.id)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          <PackageCheck className="w-4 h-4" />
                          Mark Completed
                        </button>
                      )}
                      {user && req.user_id === user.id && !isListingOwner && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="inline-flex items-center gap-1.5 bg-white text-stone-600 border border-stone-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-50 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
