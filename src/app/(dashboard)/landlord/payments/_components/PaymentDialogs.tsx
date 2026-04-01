'use client'

import { Clock, FileText, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { formatCurrency, formatDate } from '../_lib/payment-formatters'
import {
    PAYMENT_METHOD_OPTIONS,
    type DepositListItem,
    type PaymentListItem,
    type PaymentMethodValue,
} from '../_lib/payment-types'

function PaymentMethodSelect({
    id,
    value,
    onChange,
}: {
    id: string
    value: PaymentMethodValue
    onChange: (value: PaymentMethodValue) => void
}) {
    return (
        <select
            id={id}
            name={id.replace(/-/g, '_')}
            value={value}
            onChange={(event) => onChange(event.target.value as PaymentMethodValue)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
        >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )
}

export function PaymentRecordDialog({
    payment,
    paymentMethod,
    paymentReference,
    isSaving,
    onClose,
    onPaymentMethodChange,
    onPaymentReferenceChange,
    onSubmit,
}: {
    payment: PaymentListItem | null
    paymentMethod: PaymentMethodValue
    paymentReference: string
    isSaving: boolean
    onClose: () => void
    onPaymentMethodChange: (value: PaymentMethodValue) => void
    onPaymentReferenceChange: (value: string) => void
    onSubmit: () => void
}) {
    return (
        <Dialog open={Boolean(payment)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-3xl sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {payment?.type === 'late_fee' ? 'Record Fee Collection' : 'Record Rent Collection'}
                    </DialogTitle>
                </DialogHeader>

                {payment ? (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <p className="text-sm font-semibold text-neutral-900">{payment.lease?.tenant?.fullName || 'Tenant'}</p>
                            <p className="mt-1 text-sm text-neutral-500">
                                {payment.lease?.property?.title || 'Property'} - {formatCurrency(payment.amount)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                Due {formatDate(payment.dueDate)}
                                {payment.notes ? ` - ${payment.notes}` : ''}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                            Use this flow for rent and late fees. Security deposits are confirmed from the deposit collection section so the held-deposit status is updated correctly.
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment method</Label>
                            <PaymentMethodSelect
                                id="payment-method"
                                value={paymentMethod}
                                onChange={onPaymentMethodChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-reference">Reference / receipt</Label>
                            <Input
                                id="payment-reference"
                                name="payment_reference"
                                value={paymentReference}
                                onChange={(event) => onPaymentReferenceChange(event.target.value)}
                                placeholder="Optional reference number or receipt code..."
                                autoComplete="off"
                                className="h-11 rounded-xl border-neutral-200"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="h-10 rounded-xl border-neutral-200" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                                onClick={onSubmit}
                                disabled={isSaving}
                            >
                                {isSaving ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Save Record
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

export function DepositConfirmationDialog({
    deposit,
    depositMethod,
    depositReference,
    isSaving,
    onClose,
    onDepositMethodChange,
    onDepositReferenceChange,
    onSubmit,
}: {
    deposit: DepositListItem | null
    depositMethod: PaymentMethodValue
    depositReference: string
    isSaving: boolean
    onClose: () => void
    onDepositMethodChange: (value: PaymentMethodValue) => void
    onDepositReferenceChange: (value: string) => void
    onSubmit: () => void
}) {
    return (
        <Dialog open={Boolean(deposit)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-3xl sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Confirm Deposit Collection</DialogTitle>
                </DialogHeader>

                {deposit ? (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <p className="text-sm font-semibold text-neutral-900">{deposit.tenant?.fullName || 'Tenant'}</p>
                            <p className="mt-1 text-sm text-neutral-500">
                                {deposit.lease?.property?.title || 'Property'} - {formatCurrency(deposit.amount)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                Confirming this marks the security deposit as held and updates the linked lease ledger item.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit-method">Payment method</Label>
                            <PaymentMethodSelect
                                id="deposit-method"
                                value={depositMethod}
                                onChange={onDepositMethodChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit-reference">Reference / receipt</Label>
                            <Input
                                id="deposit-reference"
                                name="deposit_reference"
                                value={depositReference}
                                onChange={(event) => onDepositReferenceChange(event.target.value)}
                                placeholder="Optional deposit reference number..."
                                autoComplete="off"
                                className="h-11 rounded-xl border-neutral-200"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="h-10 rounded-xl border-neutral-200" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                                onClick={onSubmit}
                                disabled={isSaving}
                            >
                                {isSaving ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                Confirm Deposit
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
