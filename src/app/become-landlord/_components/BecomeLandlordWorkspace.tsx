'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    ImagePlus,
    Loader2,
    ShieldCheck,
    Upload,
    X,
} from '@/components/ui/icons'

import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUser } from '@/components/providers/UserProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { api } from '@convex/_generated/api'
import { cn } from '@/lib/utils'

/* ━━━━━━━━━━━━━━━━ Types ━━━━━━━━━━━━━━━━ */

type VerificationStatusRecord = {
    _id: string
    _creationTime?: number
    adminNotes?: string | null
    status: 'pending' | 'approved' | 'rejected'
    documents?: {
        businessName?: string | null
        businessRegistration?: string | null
        idNumber?: string | null
        idType?: string | null
    } | null
}

type IdType = 'national_id' | 'passport' | 'drivers_license'

const ID_TYPE_LABELS: Record<IdType, string> = {
    national_id: 'National ID',
    passport: 'Passport',
    drivers_license: "Driver's License",
}

/* ━━━━━━━━━━━━━━━━ Shared UI Primitives ━━━━━━━━━━━━━━━━ */

function SectionGroup({
    title,
    children,
    footer,
}: {
    title?: string
    children: React.ReactNode
    footer?: string
}) {
    return (
        <div className="mt-7 first:mt-0">
            {title && (
                <p className="mb-1.5 ml-4 text-[12px] font-medium uppercase tracking-[0.06em] text-neutral-400">
                    {title}
                </p>
            )}
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                {children}
            </div>
            {footer && (
                <p className="mt-1.5 ml-4 text-[12px] leading-[1.4] text-neutral-400">
                    {footer}
                </p>
            )}
        </div>
    )
}

function SectionRow({
    label,
    icon,
    children,
    last = false,
    destructive = false,
    onClick,
    className,
}: {
    label: string
    icon?: React.ReactNode
    children?: React.ReactNode
    last?: boolean
    destructive?: boolean
    onClick?: () => void
    className?: string
}) {
    const isButton = Boolean(onClick)
    const Tag = isButton ? 'button' : 'div'

    return (
        <Tag
            {...(isButton ? { type: 'button' as const, onClick } : {})}
            className={cn(
                'flex w-full items-center gap-3 px-4 py-3',
                !last && 'border-b border-neutral-100',
                isButton && 'transition-colors active:bg-neutral-50',
                className,
            )}
        >
            {icon && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                    {icon}
                </div>
            )}
            <span
                className={cn(
                    'text-[15px]',
                    destructive ? 'font-medium text-red-500' : 'text-neutral-900',
                    isButton && !destructive && 'text-left',
                )}
            >
                {label}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
                {children}
            </div>
        </Tag>
    )
}

function InputRow({
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
    last = false,
    type = 'text',
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    last?: boolean
    type?: string
}) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                !last && 'border-b border-neutral-100',
            )}
        >
            <label className="shrink-0 text-[15px] text-neutral-900 min-w-[90px]">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'w-full min-w-0 bg-transparent text-right text-[15px] text-neutral-900 outline-none placeholder:text-neutral-300',
                    disabled && 'text-neutral-400',
                )}
            />
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━ File Upload Row ━━━━━━━━━━━━━━━━ */

function FileUploadRow({
    label,
    file,
    uploading,
    onSelect,
    last = false,
}: {
    label: string
    file: File | null
    uploading: boolean
    onSelect: (file: File) => void
    last?: boolean
}) {
    const ref = useRef<HTMLInputElement>(null)

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (f) onSelect(f)
        if (ref.current) ref.current.value = ''
    }

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-3',
                !last && 'border-b border-neutral-100',
            )}
        >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                <ImagePlus className="h-3.5 w-3.5" />
            </div>
            <span className="flex-1 text-[15px] text-neutral-900">
                {label}
            </span>
            <div className="flex items-center gap-2">
                {uploading ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-neutral-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading
                    </span>
                ) : file ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                        {file.name.length > 18 ? file.name.slice(0, 15) + '…' : file.name}
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => ref.current?.click()}
                        className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-95"
                    >
                        <Upload className="h-3 w-3" />
                        Choose
                    </button>
                )}
            </div>
            <input
                ref={ref}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleChange}
            />
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━ Skeleton ━━━━━━━━━━━━━━━━ */

function BecomeLandlordSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            <Header user={undefined} isLoading={true} />
            <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-5">
                <div className="h-4 w-24 rounded-full bg-neutral-100 animate-pulse" />
                <div className="mt-8 flex flex-col items-center">
                    <div className="h-14 w-14 rounded-full bg-neutral-100 animate-pulse" />
                    <div className="mt-4 h-6 w-48 rounded-full bg-neutral-100 animate-pulse" />
                    <div className="mt-2 h-4 w-64 rounded-full bg-neutral-50 animate-pulse" />
                </div>
                {[1, 2].map((s) => (
                    <div key={s} className="mt-7">
                        <div className="mb-2 ml-4 h-3 w-28 rounded-full bg-neutral-100 animate-pulse" />
                        <div className="rounded-2xl border border-neutral-100 bg-white">
                            {[1, 2, 3].map((r) => (
                                <div
                                    key={r}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-3.5',
                                        r < 3 && 'border-b border-neutral-100',
                                    )}
                                >
                                    <div className="h-4 w-24 rounded-full bg-neutral-100 animate-pulse" />
                                    <div className="h-4 w-32 rounded-full bg-neutral-50 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>
            <MobileNav user={undefined} />
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━ Main Workspace ━━━━━━━━━━━━━━━━ */

export function BecomeLandlordWorkspace() {
    const { user, isLoading } = useUser()
    const verificationStatus = useQuery(
        api.verification.getStatus,
        user ? {} : 'skip',
    ) as VerificationStatusRecord | null | undefined
    const isStatusLoading = Boolean(user && verificationStatus === undefined)

    const submitVerification = useMutation(api.verification.submit)
    const resubmitVerification = useMutation(api.verification.resubmit)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const registerUpload = useMutation(api.files.registerUpload)

    // form state
    const [idType, setIdType] = useState<IdType | ''>('')
    const [idNumber, setIdNumber] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [businessRegistration, setBusinessRegistration] = useState('')
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
    const [idBackFile, setIdBackFile] = useState<File | null>(null)
    const [uploadingFront, setUploadingFront] = useState(false)
    const [uploadingBack, setUploadingBack] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    if (isLoading || isStatusLoading) {
        return <BecomeLandlordSkeleton />
    }

    if (user?.role === 'landlord') {
        redirect('/landlord/properties')
    }

    const stage = !user
        ? 'guest'
        : verificationStatus
            ? verificationStatus.status
            : 'ready'

    // Pre-fill from rejected submission
    const isRejected = stage === 'rejected'
    const previousData = isRejected ? verificationStatus?.documents : null

    async function uploadFile(file: File): Promise<string> {
        const uploadUrl = await generateUploadUrl({
            contentType: file.type,
            fileSize: file.size,
        })

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
        })

        if (!response.ok) throw new Error('Upload failed')

        const { storageId } = await response.json()
        await registerUpload({ storageId })
        return storageId
    }

    async function handleSubmit() {
        if (!idType || !idNumber.trim() || !idFrontFile || !idBackFile) {
            toast.error('Fill in all required fields and upload both ID images')
            return
        }

        setSubmitting(true)
        try {
            setUploadingFront(true)
            const frontId = await uploadFile(idFrontFile)
            setUploadingFront(false)

            setUploadingBack(true)
            const backId = await uploadFile(idBackFile)
            setUploadingBack(false)

            if (isRejected && verificationStatus?._id) {
                await resubmitVerification({
                    previousRequestId: verificationStatus._id as any,
                    idType: idType as IdType,
                    idNumber: idNumber.trim(),
                    businessName: businessName.trim() || undefined,
                    businessRegistration: businessRegistration.trim() || undefined,
                    idFrontStorageId: frontId as any,
                    idBackStorageId: backId as any,
                })
            } else {
                await submitVerification({
                    idType: idType as IdType,
                    idNumber: idNumber.trim(),
                    businessName: businessName.trim() || undefined,
                    businessRegistration: businessRegistration.trim() || undefined,
                    idFrontStorageId: frontId as any,
                    idBackStorageId: backId as any,
                })
            }

            toast.success('Verification request submitted')
            // reset form
            setIdType('')
            setIdNumber('')
            setBusinessName('')
            setBusinessRegistration('')
            setIdFrontFile(null)
            setIdBackFile(null)
        } catch (error: unknown) {
            toast.error(
                error instanceof Error ? error.message : 'Unable to submit request',
            )
        } finally {
            setUploadingFront(false)
            setUploadingBack(false)
            setSubmitting(false)
        }
    }

    const canSubmit =
        Boolean(idType) &&
        idNumber.trim().length > 0 &&
        Boolean(idFrontFile) &&
        Boolean(idBackFile) &&
        !submitting

    function formatDate(timestamp?: number) {
        if (!timestamp) return '—'
        return new Intl.DateTimeFormat('en', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(timestamp))
    }

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900">
            <Header user={user} userRole={user?.role} isLoading={false} />

            <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-2 sm:px-5">

                {/* ── Back ── */}
                <div className="py-2">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-[15px] font-normal text-[#007AFF] transition-opacity active:opacity-60"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Home
                    </Link>
                </div>

                {/* ── Hero ── */}
                <div className="flex flex-col items-center py-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                        <Building2 className="h-6 w-6 text-neutral-500" />
                    </div>
                    <h1 className="mt-3 text-[22px] font-semibold tracking-[-0.4px] text-neutral-900">
                        Become a Landlord
                    </h1>
                    <p className="mt-1 max-w-sm text-center text-[14px] leading-5 text-neutral-400">
                        Verify your identity to unlock property listings and management tools.
                    </p>
                </div>

                {/* ━━━━━━━━ STATUS ━━━━━━━━ */}
                <SectionGroup title="Status">
                    <SectionRow
                        label="Verification"
                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                        last={stage !== 'pending' && stage !== 'approved' && stage !== 'rejected'}
                    >
                        {stage === 'guest' && (
                            <Badge className="border-neutral-200 bg-neutral-50 text-neutral-500 text-[10px]">
                                Sign in required
                            </Badge>
                        )}
                        {stage === 'ready' && (
                            <Badge className="border-sky-200 bg-sky-50 text-sky-700 text-[10px]">
                                Ready to apply
                            </Badge>
                        )}
                        {stage === 'pending' && (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]">
                                In review
                            </Badge>
                        )}
                        {stage === 'approved' && (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                                Approved
                            </Badge>
                        )}
                        {stage === 'rejected' && (
                            <Badge className="border-red-200 bg-red-50 text-red-700 text-[10px]">
                                Needs changes
                            </Badge>
                        )}
                    </SectionRow>

                    {stage === 'pending' && (
                        <SectionRow
                            label="Submitted"
                            icon={<Clock className="h-3.5 w-3.5" />}
                            last
                        >
                            <span className="text-[14px] text-neutral-400">
                                {formatDate(verificationStatus?._creationTime)}
                            </span>
                        </SectionRow>
                    )}

                    {stage === 'approved' && (
                        <SectionRow
                            label="Account"
                            icon={<Check className="h-3.5 w-3.5" />}
                            last
                        >
                            <span className="text-[14px] text-neutral-400">
                                Landlord access active
                            </span>
                        </SectionRow>
                    )}

                    {stage === 'rejected' && verificationStatus?.adminNotes && (
                        <div className="border-t border-neutral-100 px-4 py-3">
                            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-red-400">
                                Reviewer feedback
                            </p>
                            <p className="mt-1.5 text-[14px] leading-6 text-neutral-600">
                                {verificationStatus.adminNotes}
                            </p>
                        </div>
                    )}
                </SectionGroup>

                {/* ━━━━━━━━ GUEST: SIGN IN PROMPT ━━━━━━━━ */}
                {stage === 'guest' && (
                    <SectionGroup
                        title="Get Started"
                        footer="Create a LINK account to begin the landlord verification process."
                    >
                        <div className="px-4 py-5 text-center">
                            <p className="text-[15px] text-neutral-600">
                                Sign in to start your application
                            </p>
                            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                                <Button
                                    asChild
                                    className="h-11 rounded-full bg-[#007AFF] px-6 text-white hover:bg-[#0066D6]"
                                >
                                    <Link href="/sign-in?redirect=%2Fbecome-landlord">
                                        Sign In
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 rounded-full border-neutral-200 px-6 hover:bg-neutral-50"
                                >
                                    <Link href="/sign-up?redirect=%2Fbecome-landlord">
                                        Create Account
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SectionGroup>
                )}

                {/* ━━━━━━━━ PENDING: wait state ━━━━━━━━ */}
                {stage === 'pending' && (
                    <SectionGroup
                        title="What Happens Next"
                        footer="This page updates automatically once a decision is available."
                    >
                        {[
                            'Your submission is with the LINK team for review.',
                            'The review includes identity and document verification.',
                            'You will be notified when the review is complete.',
                        ].map((text, i, arr) => (
                            <SectionRow
                                key={text}
                                label={text}
                                last={i === arr.length - 1}
                            />
                        ))}
                    </SectionGroup>
                )}

                {/* ━━━━━━━━ APPROVED: go to dashboard ━━━━━━━━ */}
                {stage === 'approved' && (
                    <SectionGroup title="Landlord Tools">
                        <Link
                            href="/landlord/properties"
                            className="flex w-full items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-50"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#34C759]">
                                <Building2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="flex-1 text-[15px] text-neutral-900">
                                Open Landlord Dashboard
                            </span>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                        </Link>
                    </SectionGroup>
                )}

                {/* ━━━━━━━━ APPLICATION FORM (ready / rejected) ━━━━━━━━ */}
                {(stage === 'ready' || stage === 'rejected') && (
                    <>
                        {/* Rejection note */}
                        {stage === 'rejected' && (
                            <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                                <p className="text-[13px] font-medium text-amber-700">
                                    Correct the issues noted above and resubmit.
                                </p>
                            </div>
                        )}

                        {/* Identity */}
                        <SectionGroup
                            title="Identity"
                            footer="Select an ID type and enter the matching number."
                        >
                            <div
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5',
                                    'border-b border-neutral-100',
                                )}
                            >
                                <label className="shrink-0 text-[15px] text-neutral-900 min-w-[90px]">
                                    ID Type
                                </label>
                                <div className="ml-auto">
                                    <Select
                                        value={idType || (previousData?.idType as string) || ''}
                                        onValueChange={(v) => setIdType(v as IdType)}
                                    >
                                        <SelectTrigger
                                            className="h-9 w-[180px] border-neutral-200 bg-transparent text-right text-[15px] text-neutral-900"
                                        >
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <InputRow
                                label="ID Number"
                                value={idNumber || previousData?.idNumber || ''}
                                onChange={setIdNumber}
                                placeholder="Enter ID number"
                                last
                            />
                        </SectionGroup>

                        {/* Business (optional) */}
                        <SectionGroup
                            title="Business Details"
                            footer="Optional. Add these if you are registering as a business."
                        >
                            <InputRow
                                label="Name"
                                value={businessName || previousData?.businessName || ''}
                                onChange={setBusinessName}
                                placeholder="Business name"
                            />
                            <InputRow
                                label="Registration"
                                value={businessRegistration || previousData?.businessRegistration || ''}
                                onChange={setBusinessRegistration}
                                placeholder="Registration number"
                                last
                            />
                        </SectionGroup>

                        {/* Documents */}
                        <SectionGroup
                            title="Documents"
                            footer="Upload clear photos or scans of the front and back of your ID."
                        >
                            <FileUploadRow
                                label="ID Front"
                                file={idFrontFile}
                                uploading={uploadingFront}
                                onSelect={setIdFrontFile}
                            />
                            <FileUploadRow
                                label="ID Back"
                                file={idBackFile}
                                uploading={uploadingBack}
                                onSelect={setIdBackFile}
                                last
                            />
                        </SectionGroup>

                        {/* Submit */}
                        <div className="mt-8 px-4">
                            <button
                                type="button"
                                onClick={() => void handleSubmit()}
                                disabled={!canSubmit}
                                className={cn(
                                    'flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]',
                                    canSubmit
                                        ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
                                )}
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting
                                    </span>
                                ) : stage === 'rejected' ? (
                                    'Resubmit Application'
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* ━━━━━━━━ PROCESS OVERVIEW ━━━━━━━━ */}
                <SectionGroup title="How It Works">
                    <SectionRow
                        label="Verify your identity"
                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    >
                        <span className="text-[13px] text-neutral-400">
                            Step 1
                        </span>
                    </SectionRow>
                    <SectionRow
                        label="Submit ID documents"
                        icon={<FileText className="h-3.5 w-3.5" />}
                    >
                        <span className="text-[13px] text-neutral-400">
                            Step 2
                        </span>
                    </SectionRow>
                    <SectionRow
                        label="Get landlord access"
                        icon={<Building2 className="h-3.5 w-3.5" />}
                        last
                    >
                        <span className="text-[13px] text-neutral-400">
                            Step 3
                        </span>
                    </SectionRow>
                </SectionGroup>

                {/* ── App info ── */}
                <div className="mt-8 text-center">
                    <p className="text-[12px] text-neutral-300">
                        LINK · Landlord Verification
                    </p>
                </div>
            </main>

            <MobileNav user={user} userRole={user?.role} />
        </div>
    )
}
