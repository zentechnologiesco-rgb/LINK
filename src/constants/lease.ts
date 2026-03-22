/**
 * Lease-related constants
 */

export const LEASE_STATUSES = [
    'draft',
    'sent_to_tenant',
    'tenant_signed',
    'approved',
    'rejected',
    'revision_requested',
    'expired',
    'terminated',
] as const

export type LeaseStatus = (typeof LEASE_STATUSES)[number]

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
    draft: 'Draft',
    sent_to_tenant: 'Sent to Tenant',
    tenant_signed: 'Tenant Signed',
    approved: 'Active',
    rejected: 'Rejected',
    revision_requested: 'Revision Requested',
    expired: 'Expired',
    terminated: 'Terminated',
}

export const LEASE_STATUS_COLORS: Record<LeaseStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent_to_tenant: 'bg-blue-100 text-blue-700',
    tenant_signed: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    revision_requested: 'bg-orange-100 text-orange-700',
    expired: 'bg-gray-100 text-gray-700',
    terminated: 'bg-red-100 text-red-700',
}

// ── Pet Policies ──
export const PET_POLICIES = [
    'no_pets',
    'cats_only',
    'dogs_only',
    'small_pets',
    'all_pets',
    'negotiable',
] as const

export type PetPolicy = (typeof PET_POLICIES)[number]

export const PET_POLICY_LABELS: Record<PetPolicy, string> = {
    no_pets: 'No Pets',
    cats_only: 'Cats Only',
    dogs_only: 'Dogs Only',
    small_pets: 'Small Pets',
    all_pets: 'All Pets',
    negotiable: 'Negotiable',
}

export const PET_POLICY_ICONS: Record<PetPolicy, string> = {
    no_pets: '🚫',
    cats_only: '🐱',
    dogs_only: '🐕',
    small_pets: '🐹',
    all_pets: '🐾',
    negotiable: '💬',
}

// ── Utilities ──
export const UTILITY_OPTIONS = [
    'Electricity',
    'Water',
    'Gas',
    'Internet',
    'Trash',
    'Sewage',
] as const

// ── Payment Frequency ──
export const PAYMENT_FREQUENCIES = ['monthly', 'weekly', 'biweekly'] as const
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number]

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
    monthly: 'Monthly',
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
}

// ── Late Fee Types ──
export const LATE_FEE_TYPES = ['percentage', 'fixed'] as const
export type LateFeeType = (typeof LATE_FEE_TYPES)[number]

export const LATE_FEE_TYPE_LABELS: Record<LateFeeType, string> = {
    percentage: '% of Rent',
    fixed: 'Fixed Amount',
}

// ── Maintenance Responsibility ──
export const MAINTENANCE_OPTIONS = ['landlord', 'tenant', 'shared'] as const
export type MaintenanceOption = (typeof MAINTENANCE_OPTIONS)[number]

export const MAINTENANCE_LABELS: Record<MaintenanceOption, string> = {
    landlord: 'Landlord',
    tenant: 'Tenant',
    shared: 'Shared',
}

// ── Lease Duration Presets ──
export const DURATION_PRESETS = [
    { label: '6 months', months: 6 },
    { label: '12 months', months: 12 },
    { label: '18 months', months: 18 },
    { label: '24 months', months: 24 },
] as const

// ── Payment Constants ──
export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
}

export const PAYMENT_TYPES = ['rent', 'deposit', 'late_fee'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
    rent: 'Rent',
    deposit: 'Deposit',
    late_fee: 'Late Fee',
}

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'eft'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    eft: 'EFT',
}

// ── Deposit Constants ──
export const DEPOSIT_STATUSES = [
    'pending',
    'held',
    'released',
    'partial_release',
    'forfeited',
] as const

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number]

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
    pending: 'Awaiting Payment',
    held: 'Held in Escrow',
    released: 'Released',
    partial_release: 'Partial Release',
    forfeited: 'Forfeited',
}

// ── Required Documents ──
export const REQUIRED_TENANT_DOCUMENTS = [
    'id_front',
    'id_back',
    'proof_of_income',
    'bank_statement',
] as const

export type TenantDocument = (typeof REQUIRED_TENANT_DOCUMENTS)[number]

export const TENANT_DOCUMENT_LABELS: Record<TenantDocument, string> = {
    id_front: 'ID (Front)',
    id_back: 'ID (Back)',
    proof_of_income: 'Proof of Income',
    bank_statement: 'Bank Statement',
}
