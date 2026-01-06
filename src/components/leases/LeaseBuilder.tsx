'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export interface LeaseClause {
    id: string
    title: string
    content: string
    isRequired: boolean
}

export interface LeaseDocumentData {
    title: string
    clauses: LeaseClause[]
    petPolicy: string
    utilitiesIncluded: string[]
    parkingIncluded: boolean
    maintenanceResponsibility: 'landlord' | 'tenant' | 'shared'
    noticePeriodDays: number
    lateFeePercentage: number
    specialConditions: string
}

interface LeaseBuilderProps {
    initialData?: Partial<LeaseDocumentData>
    onDataChange: (data: LeaseDocumentData) => void
    disabled?: boolean
}

const defaultClauses: LeaseClause[] = [
    {
        id: '1',
        title: 'Rent Payment',
        content: 'Tenant agrees to pay the monthly rent amount on or before the 1st day of each month. Late payments will incur a fee as specified in this agreement.',
        isRequired: true,
    },
    {
        id: '2',
        title: 'Security Deposit',
        content: 'Tenant shall pay a security deposit as specified, which will be held by the Landlord and returned at the end of the lease term, subject to deductions for damages or unpaid rent.',
        isRequired: true,
    },
    {
        id: '3',
        title: 'Property Condition',
        content: 'Tenant agrees to maintain the property in good condition and report any damages or maintenance issues promptly to the Landlord.',
        isRequired: true,
    },
    {
        id: '4',
        title: 'Occupancy',
        content: 'Only the Tenant and any approved occupants listed in this agreement may reside in the property. Subletting is not permitted without written consent.',
        isRequired: true,
    },
    {
        id: '5',
        title: 'Entry by Landlord',
        content: 'Landlord may enter the property with 24-hour notice for inspections, repairs, or showings, except in emergencies where immediate entry is permitted.',
        isRequired: false,
    },
    {
        id: '6',
        title: 'Termination',
        content: 'Either party may terminate this lease by providing written notice as specified in the notice period. Early termination may result in forfeiture of the security deposit.',
        isRequired: true,
    },
]

const utilityOptions = [
    'Electricity',
    'Water',
    'Gas',
    'Internet',
    'Trash Collection',
    'Sewage',
]

export function LeaseBuilder({ initialData, onDataChange, disabled }: LeaseBuilderProps) {
    const [data, setData] = useState<LeaseDocumentData>({
        title: initialData?.title || 'Residential Lease Agreement',
        clauses: initialData?.clauses || defaultClauses,
        petPolicy: initialData?.petPolicy || 'no_pets',
        utilitiesIncluded: initialData?.utilitiesIncluded || [],
        parkingIncluded: initialData?.parkingIncluded || false,
        maintenanceResponsibility: initialData?.maintenanceResponsibility || 'shared',
        noticePeriodDays: initialData?.noticePeriodDays || 30,
        lateFeePercentage: initialData?.lateFeePercentage || 5,
        specialConditions: initialData?.specialConditions || '',
    })

    const updateData = (updates: Partial<LeaseDocumentData>) => {
        const newData = { ...data, ...updates }
        setData(newData)
        onDataChange(newData)
    }

    const addClause = () => {
        const newClause: LeaseClause = {
            id: Date.now().toString(),
            title: 'New Clause',
            content: '',
            isRequired: false,
        }
        updateData({ clauses: [...data.clauses, newClause] })
    }

    const updateClause = (id: string, updates: Partial<LeaseClause>) => {
        const updatedClauses = data.clauses.map(clause =>
            clause.id === id ? { ...clause, ...updates } : clause
        )
        updateData({ clauses: updatedClauses })
    }

    const removeClause = (id: string) => {
        const clause = data.clauses.find(c => c.id === id)
        if (clause?.isRequired) return
        updateData({ clauses: data.clauses.filter(c => c.id !== id) })
    }

    const toggleUtility = (utility: string) => {
        const utilities = data.utilitiesIncluded.includes(utility)
            ? data.utilitiesIncluded.filter(u => u !== utility)
            : [...data.utilitiesIncluded, utility]
        updateData({ utilitiesIncluded: utilities })
    }

    return (
        <div className="space-y-6">
            {/* Document Title */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Document Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Lease Title</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => updateData({ title: e.target.value })}
                                disabled={disabled}
                                placeholder="e.g., Residential Lease Agreement"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lease Clauses */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Lease Clauses</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addClause}
                            disabled={disabled}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Clause
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.clauses.map((clause, index) => (
                        <div key={clause.id} className="relative border rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-medium">
                                    {index + 1}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <Input
                                        value={clause.title}
                                        onChange={(e) => updateClause(clause.id, { title: e.target.value })}
                                        disabled={disabled}
                                        className="font-medium"
                                        placeholder="Clause Title"
                                    />
                                    <Textarea
                                        value={clause.content}
                                        onChange={(e) => updateClause(clause.id, { content: e.target.value })}
                                        disabled={disabled}
                                        placeholder="Clause content..."
                                        rows={3}
                                    />
                                </div>
                                {!clause.isRequired && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeClause(clause.id)}
                                        disabled={disabled}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {clause.isRequired && (
                                <p className="text-xs text-muted-foreground ml-11">
                                    * Required clause (cannot be removed)
                                </p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Property Rules */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Property Rules & Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Pet Policy */}
                    <div className="space-y-2">
                        <Label>Pet Policy</Label>
                        <Select
                            value={data.petPolicy}
                            onValueChange={(value) => updateData({ petPolicy: value })}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_pets">No Pets Allowed</SelectItem>
                                <SelectItem value="cats_only">Cats Only</SelectItem>
                                <SelectItem value="dogs_only">Dogs Only</SelectItem>
                                <SelectItem value="small_pets">Small Pets Only</SelectItem>
                                <SelectItem value="all_pets">All Pets Allowed</SelectItem>
                                <SelectItem value="negotiable">Negotiable with Deposit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Utilities */}
                    <div className="space-y-3">
                        <Label>Utilities Included in Rent</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {utilityOptions.map((utility) => (
                                <div
                                    key={utility}
                                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${data.utilitiesIncluded.includes(utility)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !disabled && toggleUtility(utility)}
                                >
                                    <Switch
                                        checked={data.utilitiesIncluded.includes(utility)}
                                        onCheckedChange={() => toggleUtility(utility)}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">{utility}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Parking */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Parking Included</Label>
                            <p className="text-sm text-muted-foreground">
                                Does this property include parking?
                            </p>
                        </div>
                        <Switch
                            checked={data.parkingIncluded}
                            onCheckedChange={(checked) => updateData({ parkingIncluded: checked })}
                            disabled={disabled}
                        />
                    </div>

                    <Separator />

                    {/* Maintenance */}
                    <div className="space-y-2">
                        <Label>Maintenance Responsibility</Label>
                        <Select
                            value={data.maintenanceResponsibility}
                            onValueChange={(value: 'landlord' | 'tenant' | 'shared') =>
                                updateData({ maintenanceResponsibility: value })
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="landlord">Landlord (All Repairs)</SelectItem>
                                <SelectItem value="tenant">Tenant (Minor Repairs)</SelectItem>
                                <SelectItem value="shared">Shared Responsibility</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Terms & Fees */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Terms & Fees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="noticePeriod">Notice Period (Days)</Label>
                            <Input
                                id="noticePeriod"
                                type="number"
                                min={7}
                                max={90}
                                value={data.noticePeriodDays}
                                onChange={(e) => updateData({ noticePeriodDays: parseInt(e.target.value) || 30 })}
                                disabled={disabled}
                            />
                            <p className="text-xs text-muted-foreground">
                                Days required for termination notice
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lateFee">Late Payment Fee (%)</Label>
                            <Input
                                id="lateFee"
                                type="number"
                                min={0}
                                max={20}
                                value={data.lateFeePercentage}
                                onChange={(e) => updateData({ lateFeePercentage: parseInt(e.target.value) || 0 })}
                                disabled={disabled}
                            />
                            <p className="text-xs text-muted-foreground">
                                Percentage of rent charged for late payment
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Special Conditions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Special Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={data.specialConditions}
                        onChange={(e) => updateData({ specialConditions: e.target.value })}
                        disabled={disabled}
                        placeholder="Add any special conditions or notes specific to this lease agreement..."
                        rows={4}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
