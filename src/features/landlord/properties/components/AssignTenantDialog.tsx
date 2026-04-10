"use client"

import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Building2, FileCheck, Wallet, ChevronRight } from "@/components/ui/icons"

interface AssignTenantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propertyId: string
    propertyTitle: string
    propertyPrice: number
}

const steps = [
    {
        title: "Choose the tenant",
        description: "Search by email so we only create leases for real signed-up users.",
        icon: FileCheck,
    },
    {
        title: "Set the rules",
        description: "Lock rent, deposit, notice, pet, and payment rules in one guided flow.",
        icon: Wallet,
    },
    {
        title: "Send one clean lease",
        description: "The tenant reviews, uploads documents, signs, and the property responds automatically once approved.",
        icon: Building2,
    },
]

export function AssignTenantDialog({
    open,
    onOpenChange,
    propertyId,
    propertyTitle,
    propertyPrice,
}: AssignTenantDialogProps) {
    const router = useRouter()

    const handleContinue = () => {
        onOpenChange(false)
        router.push(`/landlord/leases/new?propertyId=${propertyId}`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] rounded-3xl border border-neutral-200 p-0 overflow-hidden">
                <div className="bg-neutral-950 px-8 py-7 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            Start Lease Setup
                        </DialogTitle>
                        <DialogDescription className="text-sm text-white/70">
                            We’ll take you into the guided lease builder for{" "}
                            <span className="font-semibold text-white">{propertyTitle}</span> at N${propertyPrice.toLocaleString()}.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-7 space-y-6 bg-white">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Why this flow
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-700">
                            We removed the duplicate quick-assign path so landlords and tenants only go through one clean lease flow. That keeps property status, signatures, and rent payments in sync.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <div key={step.title} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
                                    <step.icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">
                                        {index + 1}. {step.title}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-11 rounded-xl border-neutral-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                            className="h-11 rounded-xl bg-neutral-900 px-5 text-white hover:bg-neutral-800"
                        >
                            Continue to Lease Setup
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
