import { useState } from 'react';
import { CheckCircle2, AlertCircle, HeartHandshake, Send } from 'lucide-react';
import { createListing } from '@/lib/api';
import { FOOD_CATEGORIES, FOOD_UNITS } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { NewListingInput } from '@/types';

interface FormState {
  food_name: string;
  quantity: string;
  unit: string;
  category: string;
  pickup_location: string;
  availability_deadline: string;
  handling_info: string;
  allergen_info: string;
  additional_instructions: string;
  donor_name: string;
  donor_contact: string;
}

const initialState: FormState = {
  food_name: '',
  quantity: '',
  unit: 'meal packets',
  category: 'Cooked Meals',
  pickup_location: '',
  availability_deadline: '',
  handling_info: '',
  allergen_info: '',
  additional_instructions: '',
  donor_name: '',
  donor_contact: '',
};

export default function DonateFoodPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDemo = !isSupabaseConfigured;
  const { user } = useAuth();

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!form.food_name.trim()) e.food_name = 'Food name is required';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Quantity must be a positive number';
    if (!form.unit.trim()) e.unit = 'Unit is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.pickup_location.trim()) e.pickup_location = 'Pickup location is required';
    if (!form.availability_deadline) e.availability_deadline = 'Availability deadline is required';
    else if (new Date(form.availability_deadline).getTime() < Date.now())
      e.availability_deadline = 'Deadline must be in the future';
    if (!form.handling_info.trim()) e.handling_info = 'Handling information is required';
    if (!form.allergen_info.trim()) e.allergen_info = 'Allergen information is required (write "None" if no allergens)';
    if (!form.donor_name.trim()) e.donor_name = 'Your name or organization name is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    const input: NewListingInput = {
      food_name: form.food_name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      category: form.category,
      pickup_location: form.pickup_location.trim(),
      availability_deadline: new Date(form.availability_deadline).toISOString(),
      handling_info: form.handling_info.trim(),
      allergen_info: form.allergen_info.trim(),
      additional_instructions: form.additional_instructions.trim() || null,
      donor_name: form.donor_name.trim(),
      donor_contact: form.donor_contact.trim() || null,
    };

    const { error } = await createListing(input);
    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    setSuccess(true);
    setForm(initialState);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-stone-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-700 rounded-full mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">Listing Posted Successfully!</h2>
          <p className="text-stone-600 mb-1">
            Your food donation has been listed and is now visible to people looking for food.
          </p>
          <p className="text-sm text-stone-500 mb-6">
            {isDemo
              ? 'Note: This listing is stored in sample data only. Connect Supabase to persist listings between sessions.'
              : 'Your listing is saved in the database and will remain available until the pickup deadline.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Donate More Food
            </button>
            <a
              href="/find-food"
              className="bg-white text-green-700 border-2 border-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              View Listings
            </a>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (field: keyof FormState) =>
    `w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
    } text-stone-800`;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <HeartHandshake className="w-7 h-7 text-green-600" />
            <h1 className="text-3xl font-bold text-stone-800">Donate Food</h1>
          </div>
          <p className="text-stone-600">
            Share your surplus food with the community. Fill in the details below so recipients know
            what's available and how to pick it up safely.
          </p>
          {isDemo && (
            <p className="text-sm text-amber-700 mt-3 bg-amber-50 inline-block px-4 py-1.5 rounded-full">
              Sample mode — listings won't persist between sessions until Supabase is connected.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8 space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Failed to post listing</p>
                <p className="text-sm mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* Food Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Food Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.food_name}
              onChange={(e) => update('food_name', e.target.value)}
              placeholder="e.g. Vegetable Biryani, Fresh Apples"
              className={inputClass('food_name')}
            />
            {errors.food_name && <p className="text-red-500 text-sm mt-1">{errors.food_name}</p>}
          </div>

          {/* Quantity + Unit */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                placeholder="e.g. 30"
                className={inputClass('quantity')}
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={form.unit}
                onChange={(e) => update('unit', e.target.value)}
                className={inputClass('unit')}
              >
                {FOOD_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Food Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className={inputClass('category')}
            >
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Pickup Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.pickup_location}
              onChange={(e) => update('pickup_location', e.target.value)}
              placeholder="e.g. Green Leaf Restaurant, MG Road"
              className={inputClass('pickup_location')}
            />
            {errors.pickup_location && <p className="text-red-500 text-sm mt-1">{errors.pickup_location}</p>}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Availability Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.availability_deadline}
              onChange={(e) => update('availability_deadline', e.target.value)}
              className={inputClass('availability_deadline')}
            />
            {errors.availability_deadline && (
              <p className="text-red-500 text-sm mt-1">{errors.availability_deadline}</p>
            )}
            <p className="text-xs text-stone-500 mt-1">Latest time the food can be picked up.</p>
          </div>

          {/* Handling Info */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Food Preparation & Handling Info <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.handling_info}
              onChange={(e) => update('handling_info', e.target.value)}
              rows={3}
              placeholder="e.g. Prepared fresh today. Keep warm until pickup. Best consumed within 2 hours."
              className={inputClass('handling_info')}
            />
            {errors.handling_info && <p className="text-red-500 text-sm mt-1">{errors.handling_info}</p>}
          </div>

          {/* Allergen Info */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Allergen Information <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.allergen_info}
              onChange={(e) => update('allergen_info', e.target.value)}
              rows={2}
              placeholder="e.g. Contains dairy and nuts. May contain traces of gluten. Write 'None' if no allergens."
              className={inputClass('allergen_info')}
            />
            {errors.allergen_info && <p className="text-red-500 text-sm mt-1">{errors.allergen_info}</p>}
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Additional Instructions <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.additional_instructions}
              onChange={(e) => update('additional_instructions', e.target.value)}
              rows={2}
              placeholder="e.g. Please bring your own containers."
              className={inputClass('additional_instructions')}
            />
          </div>

          {/* Donor Info */}
          <div className="border-t border-stone-200 pt-6">
            <h3 className="font-semibold text-stone-700 mb-4">Your Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Donor Name / Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.donor_name}
                  onChange={(e) => update('donor_name', e.target.value)}
                  placeholder="e.g. Green Leaf Restaurant"
                  className={inputClass('donor_name')}
                />
                {errors.donor_name && <p className="text-red-500 text-sm mt-1">{errors.donor_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Contact <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.donor_contact}
                  onChange={(e) => update('donor_contact', e.target.value)}
                  placeholder="e.g. contact@greenleaf.com"
                  className={inputClass('donor_contact')}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>Posting...</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Post Food Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
