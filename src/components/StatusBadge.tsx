import type { ListingStatus, RequestStatus } from '@/types';

const listingStatusConfig: Record<ListingStatus, { label: string; classes: string; dot: string }> = {
  available: { label: 'Available', classes: 'bg-forest-50 text-forest-700 border-forest-200', dot: 'bg-forest-500' },
  accepted: { label: 'Fully Reserved', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  completed: { label: 'Completed', classes: 'bg-sage-50 text-sage-700 border-sage-200', dot: 'bg-sage-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-stone-100 text-stone-500 border-stone-200', dot: 'bg-stone-400' },
};

const requestStatusConfig: Record<RequestStatus, { label: string; classes: string; dot: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  accepted: { label: 'Accepted', classes: 'bg-forest-50 text-forest-700 border-forest-200', dot: 'bg-forest-500' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  completed: { label: 'Completed', classes: 'bg-sage-50 text-sage-700 border-sage-200', dot: 'bg-sage-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-stone-100 text-stone-500 border-stone-200', dot: 'bg-stone-400' },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const config = listingStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config = requestStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
