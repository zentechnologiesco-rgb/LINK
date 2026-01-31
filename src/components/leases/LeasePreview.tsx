'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Image from 'next/image'
import { LeaseDocumentData } from './LeaseBuilder'
import { Building2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeasePreviewProps {
    leaseDocument: LeaseDocumentData
    property: {
        title: string
        address: string
        city: string
        images?: string[]
    }
    landlord: {
        fullName: string
        email: string
        phone?: string
    }
    tenant?: {
        fullName: string
        email: string
        phone?: string
    }
    leaseTerms: {
        startDate: string
        endDate: string
        monthlyRent: number
        deposit: number
    }
    tenantSignature?: string | null
    landlordSignature?: string | null
    signedAt?: string | null
}

export function LeasePreview({
    leaseDocument,
    property,
    landlord,
    tenant,
    leaseTerms,
    tenantSignature,
    landlordSignature,
    signedAt,
}: LeasePreviewProps) {
    const petPolicyLabels: Record<string, string> = {
        no_pets: 'No pets are permitted on the premises.',
        cats_only: 'Only cats are permitted on the premises.',
        dogs_only: 'Only dogs are permitted on the premises.',
        small_pets: 'Only small pets (caged animals, fish, etc.) are permitted.',
        all_pets: 'Pets are permitted subject to a pet deposit.',
        negotiable: 'Pet policy is negotiable with an additional pet deposit.',
    }

    const maintenanceLabels: Record<string, string> = {
        landlord: 'The Landlord is responsible for all repairs and maintenance.',
        tenant: 'The Tenant is responsible for minor repairs under N$500.',
        shared: 'Minor repairs are the Tenant\'s responsibility; major repairs are the Landlord\'s.',
    }

    return (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-none print:shadow-none print:border-0 overflow-hidden font-sans">
            {/* Document Header */}
            <div className="bg-neutral-900 text-white p-10 print:bg-black">
                <div className="text-center space-y-2">
                    <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide">{leaseDocument.title}</h1>
                    <p className="text-white/60 font-medium uppercase tracking-widest text-xs font-mono">Republic of Namibia</p>
                </div>
            </div>

            <div className="p-10 space-y-10">
                {/* Property & Parties Section */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Property Info */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm shadow-neutral-900/5">
                        <div className="flex items-start gap-4">
                            <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
                                {property.images?.[0] ? (
                                    <Image
                                        src={property.images[0]}
                                        alt={property.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-neutral-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 font-mono">Property</p>
                                <p className="font-bold text-lg text-neutral-900 leading-tight mb-1">{property.title}</p>
                                <p className="text-sm text-neutral-500 font-medium">{property.address}, {property.city}</p>
                            </div>
                        </div>
                    </div>

                    {/* Lease Terms Summary */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm shadow-neutral-900/5">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 font-mono">Lease Period</p>
                                <p className="font-bold text-sm text-neutral-900">
                                    {format(new Date(leaseTerms.startDate), 'MMM d, yyyy')} -
                                    {format(new Date(leaseTerms.endDate), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 font-mono">Monthly Rent</p>
                                <p className="font-[family-name:var(--font-anton)] text-xl text-neutral-900 tracking-wide">
                                    N$ {leaseTerms.monthlyRent.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 font-mono">Security Deposit</p>
                                <p className="font-bold text-sm text-neutral-900">N$ {leaseTerms.deposit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 font-mono">Notice Period</p>
                                <p className="font-bold text-sm text-neutral-900">{leaseDocument.noticePeriodDays} days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Parties */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 border border-neutral-200 rounded-2xl bg-neutral-50/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 font-mono">Landlord</p>
                        <p className="font-bold text-neutral-900 text-lg">{landlord.fullName || 'Not specified'}</p>
                        <p className="text-sm text-neutral-500 font-medium">{landlord.email}</p>
                        {landlord.phone && <p className="text-sm text-neutral-500 font-medium">{landlord.phone}</p>}
                    </div>
                    <div className="p-6 border border-neutral-200 rounded-2xl bg-neutral-50/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 font-mono">Tenant</p>
                        {tenant ? (
                            <>
                                <p className="font-bold text-neutral-900 text-lg">{tenant.fullName || 'Not specified'}</p>
                                <p className="text-sm text-neutral-500 font-medium">{tenant.email}</p>
                                {tenant.phone && <p className="text-sm text-neutral-500 font-medium">{tenant.phone}</p>}
                            </>
                        ) : (
                            <p className="text-neutral-400 italic font-medium">To be assigned</p>
                        )}
                    </div>
                </div>

                <Separator className="bg-neutral-100" />

                {/* Lease Clauses */}
                <div>
                    <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-neutral-900 mb-6 flex items-center gap-3">
                        <FileText className="h-6 w-6 text-neutral-400" />
                        Terms and Conditions
                    </h2>
                    <div className="space-y-6">
                        {leaseDocument.clauses.map((clause, index) => (
                            <div key={clause.id} className="border-l-2 border-neutral-900 pl-5">
                                <p className="font-bold text-neutral-900 text-base mb-1">
                                    {index + 1}. {clause.title}
                                </p>
                                <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                                    {clause.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="bg-neutral-100" />

                {/* Property Rules */}
                <div>
                    <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-neutral-900 mb-6">Property Rules & Policies</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-none">
                            <p className="font-bold text-sm text-neutral-900 mb-1">Pet Policy</p>
                            <p className="text-xs text-neutral-500 font-medium">
                                {petPolicyLabels[leaseDocument.petPolicy] || 'Not specified'}
                            </p>
                        </div>
                        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-none">
                            <p className="font-bold text-sm text-neutral-900 mb-1">Maintenance</p>
                            <p className="text-xs text-neutral-500 font-medium">
                                {maintenanceLabels[leaseDocument.maintenanceResponsibility]}
                            </p>
                        </div>
                        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-none">
                            <p className="font-bold text-sm text-neutral-900 mb-1">Utilities Included</p>
                            {leaseDocument.utilitiesIncluded.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {leaseDocument.utilitiesIncluded.map((utility) => (
                                        <Badge key={utility} variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200">
                                            {utility}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-500 font-medium mt-1">
                                    No utilities included. Tenant is responsible for all utilities.
                                </p>
                            )}
                        </div>
                        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-none">
                            <p className="font-bold text-sm text-neutral-900 mb-1">Parking</p>
                            <p className="text-xs text-neutral-500 font-medium">
                                {leaseDocument.parkingIncluded
                                    ? 'Parking is included with this lease.'
                                    : 'Parking is not included.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Late Fee */}
                {leaseDocument.lateFeePercentage > 0 && (
                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl">
                        <p className="font-bold text-sm text-neutral-900 mb-1">Late Payment Fee</p>
                        <p className="text-xs text-neutral-500 font-medium">
                            A late fee of {leaseDocument.lateFeePercentage}% of the monthly rent will be charged
                            for payments received after the 5th day of each month.
                        </p>
                    </div>
                )}

                {/* Special Conditions */}
                {leaseDocument.specialConditions && (
                    <>
                        <Separator className="bg-neutral-100" />
                        <div>
                            <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-neutral-900 mb-6">Special Conditions</h2>
                            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl">
                                <p className="text-sm text-neutral-700 font-medium whitespace-pre-wrap">
                                    {leaseDocument.specialConditions}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                <Separator className="bg-neutral-100" />

                {/* Signatures */}
                <div>
                    <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-neutral-900 mb-6">Signatures</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Landlord Signature */}
                        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">
                                Landlord Signature
                            </p>
                            {landlordSignature ? (
                                <div className="h-24 bg-transparent flex items-center justify-center">
                                    <Image
                                        src={landlordSignature}
                                        alt="Landlord signature"
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-neutral-300 text-xs font-bold uppercase tracking-wider">
                                    Pending signature
                                </div>
                            )}
                            <div className="h-px bg-neutral-200 w-full mt-2 mb-2" />
                            <p className="text-sm font-bold text-neutral-900">{landlord.fullName}</p>
                        </div>

                        {/* Tenant Signature */}
                        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">
                                Tenant Signature
                            </p>
                            {tenantSignature ? (
                                <div className="h-24 bg-transparent flex items-center justify-center">
                                    <Image
                                        src={tenantSignature}
                                        alt="Tenant signature"
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-neutral-300 text-xs font-bold uppercase tracking-wider">
                                    Pending signature
                                </div>
                            )}
                            <div className="h-px bg-neutral-200 w-full mt-2 mb-2" />
                            {tenant && <p className="text-sm font-bold text-neutral-900">{tenant.fullName}</p>}
                            {signedAt && (
                                <p className="text-[10px] text-neutral-400 font-medium mt-1 uppercase tracking-wider">
                                    Signed: {format(new Date(signedAt), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-neutral-300 font-bold uppercase tracking-widest pt-6 border-t border-neutral-100 font-mono">
                    <p>This document was generated electronically and is legally binding upon acceptance by all parties.</p>
                    <p className="mt-2">LINK Property Rental Platform</p>
                </div>
            </div>
        </div>
    )
}
