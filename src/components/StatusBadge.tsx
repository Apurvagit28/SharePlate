import type { ListingStatus, RequestStatus } from '@/types';

const listingStatusConfig: Record<ListingStatus, { label: string; classes: string }> = {
  available: { label: 'Available', classes: 'bg-green-100 text-green-800 border-green-200' },
  accepted: { label: 'Fully Reserved', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-stone-200 text-stone-600 border-stone-300' },
};

const requestStatusConfig: Record<RequestStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-800 border-red-200' },
  completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-stone-200 text-stone-600 border-stone-300' },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const config = listingStatusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config = requestStatusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
}
