'use client'

import { type ElementType, type ReactNode } from 'react'
import {
    Ban,
    Car,
    Cat,
    Check,
    Cigarette,
    Dog,
    Droplets,
    Flame,
    Home,
    MessageSquareMore,
    Minus,
    PawPrint,
    Plus,
    Rabbit,
    Trash2,
    Wifi,
    Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    DURATION_PRESETS,
    LATE_FEE_TYPES,
    LATE_FEE_TYPE_LABELS,
    MAINTENANCE_LABELS,
    MAINTENANCE_OPTIONS,
    PET_POLICIES,
    PET_POLICY_LABELS,
    UTILITY_OPTIONS,
    type LateFeeType,
    type MaintenanceOption,
    type PetPolicy,
} from '@/constants/lease'

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

interface LeaseRulesConfiguratorProps {
    data: RentalRulesData
    onChange: (data: RentalRulesData) => void
    disabled?: boolean
    showDates?: boolean
    showFinancials?: boolean
}

const inputClassName =
    'h-12 rounded-[16px] border-neutral-200 bg-neutral-50 px-4 text-[15px] font-medium text-neutral-900 shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10'

const petPolicyMeta: Record<PetPolicy, { icon: ElementType }> = {
    no_pets: { icon: Ban },
    cats_only: { icon: Cat },
    dogs_only: { icon: Dog },
    small_pets: { icon: Rabbit },
    all_pets: { icon: PawPrint },
    negotiable: { icon: MessageSquareMore },
}

const utilityIconMap: Record<string, ElementType> = {
    Electricity: Zap,
    Water: Droplets,
    Gas: Flame,
    Internet: Wifi,
    Trash: Trash2,
    Sewage: Droplets,
}

export function LeaseRulesConfigurator({
    data,
    onChange,
    disabled = false,
    showDates = true,
    showFinancials = true,
}: LeaseRulesConfiguratorProps) {
    const update = (updates: Partial<RentalRulesData>) => {
        onChange({ ...data, ...updates })
    }

    const toggleUtility = (utility: string) => {
        const nextUtilities = data.utilitiesIncluded.includes(utility)
            ? data.utilitiesIncluded.filter((currentUtility) => currentUtility !== utility)
            : [...data.utilitiesIncluded, utility]

        update({ utilitiesIncluded: nextUtilities })
    }

    const setDuration = (months: number) => {
        const start = new Date(data.startDate)
        const end = new Date(start)
        end.setMonth(end.getMonth() + months)
        update({ endDate: end.toISOString().split('T')[0] })
    }

    return (
        <div className="space-y-10">
            {showDates && (
                <SectionBlock
                    title="Lease period"
                    description="Set the dates first, then use a preset when you want the standard terms."
                >
                    <GroupSurface>
                        <FieldRow label="Start date">
                            <Input
                                type="date"
                                value={data.startDate}
                                onChange={(event) => update({ startDate: event.target.value })}
                                disabled={disabled}
                                className={inputClassName}
                            />
                        </FieldRow>
                        <FieldRow label="End date">
                            <Input
                                type="date"
                                value={data.endDate}
                                onChange={(event) => update({ endDate: event.target.value })}
                                disabled={disabled}
                                className={inputClassName}
                            />
                        </FieldRow>
                        <FieldRow label="Duration">
                            <div className="flex flex-wrap gap-2">
                                {DURATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset.months}
                                        type="button"
                                        onClick={() => setDuration(preset.months)}
                                        disabled={disabled}
                                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </FieldRow>
                    </GroupSurface>
                </SectionBlock>
            )}

            {showFinancials && (
                <SectionBlock
                    title="Pricing"
                    description="Keep the financial terms clear and legible."
                >
                    <GroupSurface>
                        <FieldRow label="Monthly rent">
                            <Input
                                type="number"
                                min={0}
                                value={data.monthlyRent || ''}
                                onChange={(event) => update({ monthlyRent: Number(event.target.value) })}
                                disabled={disabled}
                                className={cn(inputClassName, 'font-semibold')}
                                placeholder="0"
                            />
                        </FieldRow>
                        <FieldRow label="Deposit">
                            <div className="space-y-2">
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.deposit || ''}
                                    onChange={(event) => update({ deposit: Number(event.target.value) })}
                                    disabled={disabled}
                                    className={cn(inputClassName, 'font-semibold')}
                                    placeholder="0"
                                />
                                {data.monthlyRent > 0 && data.deposit !== data.monthlyRent && (
                                    <button
                                        type="button"
                                        onClick={() => update({ deposit: data.monthlyRent })}
                                        disabled={disabled}
                                        className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                                    >
                                        Match deposit to rent
                                    </button>
                                )}
                            </div>
                        </FieldRow>
                    </GroupSurface>
                </SectionBlock>
            )}

            <SectionBlock
                title="Payment rules"
                description="Define due dates, grace, and late fee behavior."
            >
                <GroupSurface>
                    <FieldRow label="Rent due day">
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={1}
                                max={28}
                                value={data.rentDueDay}
                                onChange={(event) =>
                                    update({ rentDueDay: Math.min(28, Math.max(1, Number(event.target.value))) })
                                }
                                disabled={disabled}
                                className={cn(inputClassName, 'w-24 text-center font-semibold')}
                            />
                            <span className="text-sm text-neutral-500">of each month</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Grace period">
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={0}
                                max={15}
                                value={data.gracePeriodDays}
                                onChange={(event) =>
                                    update({ gracePeriodDays: Math.min(15, Math.max(0, Number(event.target.value))) })
                                }
                                disabled={disabled}
                                className={cn(inputClassName, 'w-24 text-center font-semibold')}
                            />
                            <span className="text-sm text-neutral-500">days</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Late fee">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {LATE_FEE_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => update({ lateFeeType: type })}
                                        disabled={disabled}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                                            data.lateFeeType === type
                                                ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                                                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                                        )}
                                    >
                                        {LATE_FEE_TYPE_LABELS[type]}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min={0}
                                    max={data.lateFeeType === 'percentage' ? 25 : 10000}
                                    value={data.lateFeeAmount}
                                    onChange={(event) => update({ lateFeeAmount: Number(event.target.value) })}
                                    disabled={disabled}
                                    className={cn(inputClassName, 'w-28 text-center font-semibold')}
                                />
                                <span className="text-sm text-neutral-500">
                                    {data.lateFeeType === 'percentage' ? '% of rent' : 'N$'}
                                </span>
                            </div>
                        </div>
                    </FieldRow>
                </GroupSurface>
            </SectionBlock>

            <SectionBlock
                title="Policies"
                description="Use lightweight selectors instead of stacked cards."
            >
                <GroupSurface>
                    <FieldRow label="Pet policy">
                        <div className="flex flex-wrap gap-2">
                            {PET_POLICIES.map((policy) => {
                                const PolicyIcon = petPolicyMeta[policy].icon
                                const isSelected = data.petPolicy === policy

                                return (
                                    <SelectorPill
                                        key={policy}
                                        icon={PolicyIcon}
                                        label={PET_POLICY_LABELS[policy]}
                                        selected={isSelected}
                                        onClick={() => update({ petPolicy: policy })}
                                        disabled={disabled}
                                    />
                                )
                            })}
                        </div>
                    </FieldRow>

                    <FieldRow label="Utilities">
                        <div className="flex flex-wrap gap-2">
                            {UTILITY_OPTIONS.map((utility) => {
                                const UtilityIcon = utilityIconMap[utility] ?? Zap
                                const isSelected = data.utilitiesIncluded.includes(utility)

                                return (
                                    <SelectorPill
                                        key={utility}
                                        icon={isSelected ? Check : UtilityIcon}
                                        label={utility}
                                        selected={isSelected}
                                        onClick={() => toggleUtility(utility)}
                                        disabled={disabled}
                                    />
                                )
                            })}
                        </div>
                    </FieldRow>

                    <FieldRow label="Maintenance">
                        <div className="flex flex-wrap gap-2">
                            {MAINTENANCE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => update({ maintenanceResponsibility: option })}
                                    disabled={disabled}
                                    className={cn(
                                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                                        data.maintenanceResponsibility === option
                                            ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                                            : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                                    )}
                                >
                                    {MAINTENANCE_LABELS[option]}
                                </button>
                            ))}
                        </div>
                    </FieldRow>
                </GroupSurface>
            </SectionBlock>

            <SectionBlock
                title="Property rules"
                description="Keep the house rules compact and easy to scan."
            >
                <GroupSurface>
                    <ToggleRow
                        icon={Car}
                        label="Parking included"
                        description="A parking spot is bundled into this rental."
                        checked={data.parkingIncluded}
                        onChange={(value) => update({ parkingIncluded: value })}
                        disabled={disabled}
                    />
                    <ToggleRow
                        icon={Cigarette}
                        label="Smoking allowed"
                        description="Smoking is permitted inside the property."
                        checked={data.smokingAllowed}
                        onChange={(value) => update({ smokingAllowed: value })}
                        disabled={disabled}
                    />
                    <ToggleRow
                        icon={Home}
                        label="Subletting allowed"
                        description="The tenant may sublet with written consent."
                        checked={data.sublettingAllowed}
                        onChange={(value) => update({ sublettingAllowed: value })}
                        disabled={disabled}
                    />
                </GroupSurface>
            </SectionBlock>

            <SectionBlock
                title="Occupancy and notice"
                description="Finish the operational details with as little noise as possible."
            >
                <GroupSurface>
                    <FieldRow label="Max occupants">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => update({ maxOccupants: Math.max(1, data.maxOccupants - 1) })}
                                disabled={disabled || data.maxOccupants <= 1}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40"
                            >
                                <Minus className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                            <div className="min-w-[56px] text-center">
                                <p className="text-[1.35rem] font-semibold tracking-[-0.04em] text-neutral-950">
                                    {data.maxOccupants}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => update({ maxOccupants: Math.min(20, data.maxOccupants + 1) })}
                                disabled={disabled || data.maxOccupants >= 20}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                        </div>
                    </FieldRow>
                    <FieldRow label="Notice period">
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min={7}
                                max={90}
                                value={data.noticePeriodDays}
                                onChange={(event) =>
                                    update({ noticePeriodDays: Math.min(90, Math.max(7, Number(event.target.value))) })
                                }
                                disabled={disabled}
                                className={cn(inputClassName, 'w-28 text-center font-semibold')}
                            />
                            <span className="text-sm text-neutral-500">days</span>
                        </div>
                    </FieldRow>
                </GroupSurface>
            </SectionBlock>
        </div>
    )
}

function SectionBlock({
    title,
    description,
    children,
}: {
    title: string
    description: string
    children: ReactNode
}) {
    return (
        <section>
            <div className="mb-5">
                <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
            </div>
            {children}
        </section>
    )
}

function GroupSurface({ children }: { children: ReactNode }) {
    return (
        <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
            {children}
        </div>
    )
}

function FieldRow({
    label,
    children,
}: {
    label: string
    children: ReactNode
}) {
    return (
        <div className="grid gap-3 px-0 py-5 sm:grid-cols-[180px,minmax(0,1fr)] sm:items-center">
            <p className="text-sm font-medium text-neutral-500">{label}</p>
            <div>{children}</div>
        </div>
    )
}

function SelectorPill({
    icon: Icon,
    label,
    selected,
    onClick,
    disabled,
}: {
    icon: ElementType
    label: string
    selected: boolean
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                    ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            )}
        >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
        </button>
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
    icon: ElementType
    label: string
    description: string
    checked: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-0 py-5">
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-neutral-500" strokeWidth={2} />
                <div>
                    <p className="text-sm font-semibold text-neutral-950">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
                </div>
            </div>

            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                className="shadow-none data-[state=checked]:bg-[#1d9bf0]"
            />
        </div>
    )
}
