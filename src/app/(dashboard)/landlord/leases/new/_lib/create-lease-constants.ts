import {
    Building2,
    FileText,
    Send,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react'

import { type RentalRulesData } from '@/features/landlord/leases/components/LeaseRulesConfigurator'

import { type StepDef } from './create-lease-types'

const currency = new Intl.NumberFormat('en-US')

export const STEPS: StepDef[] = [
    { key: 'property', label: 'Property', title: 'Choose property', subtitle: 'Select the home for this lease', icon: Building2 },
    { key: 'tenant', label: 'Tenant', title: 'Find tenant', subtitle: 'Search by email to link the account', icon: User },
    { key: 'rules', label: 'Terms', title: 'Set terms', subtitle: 'Pricing, dates, rules, and policies', icon: Sparkles },
    { key: 'clauses', label: 'Clauses', title: 'Refine clauses', subtitle: 'Review required and add custom terms', icon: FileText },
    { key: 'review', label: 'Review', title: 'Review draft', subtitle: 'Check everything before sending', icon: ShieldCheck },
    { key: 'send', label: 'Send', title: 'Send or save', subtitle: 'Deliver the agreement or keep as draft', icon: Send },
]

export const humanDate = new Intl.DateTimeFormat('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })
export const BLOCKING_LEASE_STATUSES = new Set(['draft', 'sent_to_tenant', 'tenant_signed', 'revision_requested', 'approved'])
export const PARKING_AMENITY_KEYWORDS = ['parking', 'garage']
export const LEASE_UTILITY_LABEL_MAP: Record<string, string> = {
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    trash: 'Trash',
    'trash collection': 'Trash',
    sewage: 'Sewage',
}
export const LEASE_PET_POLICY_MAP: Partial<Record<string, RentalRulesData['petPolicy']>> = {
    no_pets: 'no_pets',
    cats_only: 'cats_only',
    dogs_only: 'dogs_only',
    small_pets: 'small_pets',
    all_pets: 'all_pets',
    cats_and_dogs: 'all_pets',
    negotiable: 'negotiable',
}

export function formatCurrency(amount: number) {
    return `N$${currency.format(amount || 0)}`
}
