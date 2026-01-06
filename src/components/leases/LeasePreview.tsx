'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Image from 'next/image'
import { LeaseDocumentData } from './LeaseBuilder'
import { Building2, User, Calendar, DollarSign, FileText } from 'lucide-react'

interface LeasePreviewProps {
    leaseDocument: LeaseDocumentData
    property: {
        title: string
        address: string
        city: string
        images?: string[]
    }
    landlord: {
        full_name: string
        email: string
        phone?: string
    }
    tenant?: {
        full_name: string
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
        <div className="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
            {/* Document Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-t-lg print:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">{leaseDocument.title}</h1>
                    <p className="text-slate-300 mt-1">Republic of Namibia</p>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Property & Parties Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Property Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {property.images?.[0] ? (
                                        <Image
                                            src={property.images[0]}
                                            alt={property.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Property</p>
                                    <p className="font-semibold">{property.title}</p>
                                    <p className="text-sm text-muted-foreground">{property.address}</p>
                                    <p className="text-sm text-muted-foreground">{property.city}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lease Terms Summary */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Lease Period</p>
                                    <p className="font-semibold text-sm">
                                        {format(new Date(leaseTerms.startDate), 'MMM d, yyyy')} -
                                        {format(new Date(leaseTerms.endDate), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
                                    <p className="font-semibold text-lg text-green-600">
                                        N$ {leaseTerms.monthlyRent.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Security Deposit</p>
                                    <p className="font-semibold">N$ {leaseTerms.deposit.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Notice Period</p>
                                    <p className="font-semibold">{leaseDocument.noticePeriodDays} days</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Parties */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Landlord</p>
                        <p className="font-semibold">{landlord.full_name || 'Not specified'}</p>
                        <p className="text-sm text-muted-foreground">{landlord.email}</p>
                        {landlord.phone && <p className="text-sm text-muted-foreground">{landlord.phone}</p>}
                    </div>
                    <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tenant</p>
                        {tenant ? (
                            <>
                                <p className="font-semibold">{tenant.full_name || 'Not specified'}</p>
                                <p className="text-sm text-muted-foreground">{tenant.email}</p>
                                {tenant.phone && <p className="text-sm text-muted-foreground">{tenant.phone}</p>}
                            </>
                        ) : (
                            <p className="text-muted-foreground italic">To be assigned</p>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Lease Clauses */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Terms and Conditions
                    </h2>
                    <div className="space-y-4">
                        {leaseDocument.clauses.map((clause, index) => (
                            <div key={clause.id} className="border-l-2 border-slate-200 pl-4">
                                <p className="font-medium text-sm">
                                    {index + 1}. {clause.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {clause.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Property Rules */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Property Rules & Policies</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">Pet Policy</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {petPolicyLabels[leaseDocument.petPolicy] || 'Not specified'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">Maintenance</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {maintenanceLabels[leaseDocument.maintenanceResponsibility]}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">Utilities Included</p>
                            {leaseDocument.utilitiesIncluded.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {leaseDocument.utilitiesIncluded.map((utility) => (
                                        <Badge key={utility} variant="secondary" className="text-xs">
                                            {utility}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-1">
                                    No utilities included. Tenant is responsible for all utilities.
                                </p>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">Parking</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {leaseDocument.parkingIncluded
                                    ? 'Parking is included with this lease.'
                                    : 'Parking is not included.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Late Fee */}
                {leaseDocument.lateFeePercentage > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-sm text-orange-800">Late Payment Fee</p>
                        <p className="text-sm text-orange-700 mt-1">
                            A late fee of {leaseDocument.lateFeePercentage}% of the monthly rent will be charged
                            for payments received after the 5th day of each month.
                        </p>
                    </div>
                )}

                {/* Special Conditions */}
                {leaseDocument.specialConditions && (
                    <>
                        <Separator />
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Special Conditions</h2>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                    {leaseDocument.specialConditions}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                <Separator />

                {/* Signatures */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Signatures</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Landlord Signature */}
                        <div className="border rounded-lg p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                                Landlord Signature
                            </p>
                            {landlordSignature ? (
                                <div className="h-24 border rounded bg-white flex items-center justify-center">
                                    <Image
                                        src={landlordSignature}
                                        alt="Landlord signature"
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-sm">
                                    Pending signature
                                </div>
                            )}
                            <p className="text-sm mt-2">{landlord.full_name}</p>
                        </div>

                        {/* Tenant Signature */}
                        <div className="border rounded-lg p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                                Tenant Signature
                            </p>
                            {tenantSignature ? (
                                <div className="h-24 border rounded bg-white flex items-center justify-center">
                                    <Image
                                        src={tenantSignature}
                                        alt="Tenant signature"
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-sm">
                                    Pending signature
                                </div>
                            )}
                            {tenant && <p className="text-sm mt-2">{tenant.full_name}</p>}
                            {signedAt && (
                                <p className="text-xs text-muted-foreground">
                                    Signed: {format(new Date(signedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                    <p>This document was generated electronically and is legally binding upon acceptance by all parties.</p>
                    <p className="mt-1">ZEN Property Rental Platform</p>
                </div>
            </div>
        </div>
    )
}
