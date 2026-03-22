'use client'

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    PET_POLICIES,
    PET_POLICY_LABELS,
    PET_POLICY_ICONS,
    UTILITY_OPTIONS,
    LATE_FEE_TYPES,
    LATE_FEE_TYPE_LABELS,
    MAINTENANCE_OPTIONS,
    MAINTENANCE_LABELS,
    DURATION_PRESETS,
    type PetPolicy,
    type LateFeeType,
    type MaintenanceOption,
} from '@/constants/lease'
import {
    Dog,
    Zap,
    Car,
    Wrench,
    Calendar,
    Clock,
    DollarSign,
    Users,
    Cigarette,
    Home,
    Minus,
    Plus,
} from 'lucide-react'

export interface RentalRulesData {
    startDate: string
    endDate: string
    monthlyRent: number
    deposit: number
    rentDueDay: number
    gracePeriodDays: number
    lateFeeType: LateFeeType
    lateFeeAmount: number
    petPolicy: PetPolicy
    utilitiesIncluded: string[]
    parkingIncluded: boolean
    maintenanceResponsibility: MaintenanceOption
    noticePeriodDays: number
    maxOccupants: number
    smokingAllowed: boolean
    sublettingAllowed: boolean
}

interface RentalRulesConfiguratorProps {
    data: RentalRulesData
    onChange: (data: RentalRulesData) => void
    disabled?: boolean
    showDates?: boolean
    showFinancials?: boolean
}

export function RentalRulesConfigurator({
    data,
    onChange,
    disabled = false,
    showDates = true,
    showFinancials = true,
}: RentalRulesConfiguratorProps) {
    const update = (updates: Partial<RentalRulesData>) => {
        onChange({ ...data, ...updates })
    }

    const toggleUtility = (utility: string) => {
        const updated = data.utilitiesIncluded.includes(utility)
            ? data.utilitiesIncluded.filter((u) => u !== utility)
            : [...data.utilitiesIncluded, utility]
        update({ utilitiesIncluded: updated })
    }

    const setDuration = (months: number) => {
        const start = new Date(data.startDate)
        const end = new Date(start)
        end.setMonth(end.getMonth() + months)
        update({ endDate: end.toISOString().split('T')[0] })
    }

    return (
        <div className="space-y-6">
            {/* ── Dates ── */}
            {showDates && (
                <section>
                    <SectionHeader icon={Calendar} label="Lease Period" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <Label className="text-xs text-neutral-500 mb-1.5 block">Start Date</Label>
                            <Input
                                type="date"
                                value={data.startDate}
                                onChange={(e) => update({ startDate: e.target.value })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-medium"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-neutral-500 mb-1.5 block">End Date</Label>
                            <Input
                                type="date"
                                value={data.endDate}
                                onChange={(e) => update({ endDate: e.target.value })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {DURATION_PRESETS.map((preset) => (
                            <button
                                key={preset.months}
                                type="button"
                                onClick={() => setDuration(preset.months)}
                                disabled={disabled}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Financials ── */}
            {showFinancials && (
                <section>
                    <SectionHeader icon={DollarSign} label="Financials" />
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <Label className="text-xs text-neutral-500 mb-1.5 block">Monthly Rent (N$)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.monthlyRent || ''}
                                onChange={(e) => update({ monthlyRent: Number(e.target.value) })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-bold text-lg"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-neutral-500 mb-1.5 block">Deposit (N$)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.deposit || ''}
                                onChange={(e) => update({ deposit: Number(e.target.value) })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-bold text-lg"
                                placeholder="0"
                            />
                            {data.monthlyRent > 0 && data.deposit !== data.monthlyRent && (
                                <button
                                    type="button"
                                    onClick={() => update({ deposit: data.monthlyRent })}
                                    disabled={disabled}
                                    className="text-xs text-neutral-500 hover:text-neutral-900 mt-1.5 underline underline-offset-2"
                                >
                                    Same as rent
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Rent Due Day ── */}
            <section>
                <SectionHeader icon={Clock} label="Payment Rules" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-neutral-500 mb-1.5 block">Rent Due Day</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                max={28}
                                value={data.rentDueDay}
                                onChange={(e) => update({ rentDueDay: Math.min(28, Math.max(1, Number(e.target.value))) })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-bold text-center w-20"
                            />
                            <span className="text-xs text-neutral-400">of each month</span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-neutral-500 mb-1.5 block">Grace Period</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={0}
                                max={15}
                                value={data.gracePeriodDays}
                                onChange={(e) => update({ gracePeriodDays: Math.min(15, Math.max(0, Number(e.target.value))) })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-bold text-center w-20"
                            />
                            <span className="text-xs text-neutral-400">days</span>
                        </div>
                    </div>
                </div>

                {/* Late Fee */}
                <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                    <Label className="text-xs text-neutral-500 mb-3 block">Late Payment Fee</Label>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-xl overflow-hidden border border-neutral-200">
                            {LATE_FEE_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => update({ lateFeeType: type })}
                                    disabled={disabled}
                                    className={cn(
                                        'px-4 py-2.5 text-xs font-semibold transition-colors',
                                        data.lateFeeType === type
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                    )}
                                >
                                    {LATE_FEE_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            min={0}
                            max={data.lateFeeType === 'percentage' ? 25 : 10000}
                            value={data.lateFeeAmount}
                            onChange={(e) => update({ lateFeeAmount: Number(e.target.value) })}
                            disabled={disabled}
                            className="h-10 rounded-xl bg-white border-neutral-200 text-neutral-900 font-bold text-center w-24"
                        />
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                            {data.lateFeeType === 'percentage' ? '% of rent' : 'N$'}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Pet Policy ── */}
            <section>
                <SectionHeader icon={Dog} label="Pet Policy" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PET_POLICIES.map((policy) => (
                        <button
                            key={policy}
                            type="button"
                            onClick={() => update({ petPolicy: policy })}
                            disabled={disabled}
                            className={cn(
                                'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center',
                                data.petPolicy === policy
                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                            )}
                        >
                            <span className="text-lg">{PET_POLICY_ICONS[policy]}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide leading-tight">
                                {PET_POLICY_LABELS[policy]}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Utilities ── */}
            <section>
                <SectionHeader icon={Zap} label="Utilities Included" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {UTILITY_OPTIONS.map((utility) => {
                        const isSelected = data.utilitiesIncluded.includes(utility)
                        return (
                            <button
                                key={utility}
                                type="button"
                                onClick={() => toggleUtility(utility)}
                                disabled={disabled}
                                className={cn(
                                    'flex items-center gap-2.5 p-3 rounded-xl border transition-all',
                                    isSelected
                                        ? 'bg-neutral-900 text-white border-neutral-900'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                )}
                            >
                                <div className={cn(
                                    'h-5 w-5 rounded-md flex items-center justify-center text-xs',
                                    isSelected ? 'bg-white/20' : 'bg-neutral-100'
                                )}>
                                    {isSelected ? '✓' : ''}
                                </div>
                                <span className="text-sm font-medium">{utility}</span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* ── Toggle Rules ── */}
            <section>
                <SectionHeader icon={Home} label="Property Rules" />
                <div className="space-y-1">
                    <ToggleRow
                        icon={Car}
                        label="Parking Included"
                        description="A parking spot is included with this rental"
                        checked={data.parkingIncluded}
                        onChange={(v) => update({ parkingIncluded: v })}
                        disabled={disabled}
                    />
                    <ToggleRow
                        icon={Cigarette}
                        label="Smoking Allowed"
                        description="Smoking permitted inside the property"
                        checked={data.smokingAllowed}
                        onChange={(v) => update({ smokingAllowed: v })}
                        disabled={disabled}
                    />
                    <ToggleRow
                        icon={Home}
                        label="Subletting Allowed"
                        description="Tenant may sublet with written consent"
                        checked={data.sublettingAllowed}
                        onChange={(v) => update({ sublettingAllowed: v })}
                        disabled={disabled}
                    />
                </div>
            </section>

            {/* ── Maintenance ── */}
            <section>
                <SectionHeader icon={Wrench} label="Maintenance Responsibility" />
                <div className="flex rounded-xl overflow-hidden border border-neutral-200">
                    {MAINTENANCE_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => update({ maintenanceResponsibility: option })}
                            disabled={disabled}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold transition-colors',
                                data.maintenanceResponsibility === option
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                            )}
                        >
                            {MAINTENANCE_LABELS[option]}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Occupancy & Notice ── */}
            <section>
                <SectionHeader icon={Users} label="Occupancy & Notice" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-neutral-500 mb-2 block">Max Occupants</Label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => update({ maxOccupants: Math.max(1, data.maxOccupants - 1) })}
                                disabled={disabled || data.maxOccupants <= 1}
                                className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-2xl font-bold text-neutral-900 w-10 text-center">
                                {data.maxOccupants}
                            </span>
                            <button
                                type="button"
                                onClick={() => update({ maxOccupants: Math.min(20, data.maxOccupants + 1) })}
                                disabled={disabled || data.maxOccupants >= 20}
                                className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-neutral-500 mb-2 block">Notice Period</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={7}
                                max={90}
                                value={data.noticePeriodDays}
                                onChange={(e) => update({ noticePeriodDays: Math.min(90, Math.max(7, Number(e.target.value))) })}
                                disabled={disabled}
                                className="h-12 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-bold text-center w-20"
                            />
                            <span className="text-xs text-neutral-400">days</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

// ── Helpers ──

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-neutral-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">{label}</span>
        </div>
    )
}

function ToggleRow({
    icon: Icon,
    label,
    description,
    checked,
    onChange,
    disabled,
}: {
    icon: React.ElementType
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-neutral-400" />
                <div>
                    <p className="text-sm font-medium text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-400">{description}</p>
                </div>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                className="data-[state=checked]:bg-neutral-900"
            />
        </div>
    )
}
