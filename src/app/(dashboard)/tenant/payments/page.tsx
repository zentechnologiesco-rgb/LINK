'use client'

import { Clock, CreditCard, BarChart3, Bell } from 'lucide-react'

export default function TenantPaymentsPage() {
    return (
        <div className="px-8 py-8 md:px-12 md:py-12 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-12">
                <h1 className="font-[family-name:var(--font-anton)] text-4xl md:text-5xl tracking-wide text-black mb-3">
                    Payments
                </h1>
                <p className="text-black/60 text-lg font-medium">
                    Manage your rent payments and deposits
                </p>
            </div>

            {/* Coming Soon Card */}
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center rounded-3xl border border-dashed border-black/10 bg-gray-50/50 min-h-[50vh]">
                {/* Icon */}
                <div className="h-20 w-20 rounded-2xl bg-white border border-black/10 flex items-center justify-center mb-6">
                    <Clock className="h-8 w-8 text-black/20" />
                </div>

                {/* Content */}
                <h3 className="font-[family-name:var(--font-anton)] text-3xl text-black mb-4 tracking-wide">
                    Payment Management
                </h3>
                <p className="text-black/60 mb-12 max-w-lg text-lg leading-relaxed">
                    We're building a powerful payment management system to help you track rent payments,
                    manage deposits, and stay on top of your rental expenses.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                    <div className="p-6 rounded-2xl border border-black/10 bg-white text-center">
                        <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-6 h-6 text-black/60" />
                        </div>
                        <p className="font-[family-name:var(--font-anton)] text-lg text-black mb-1">Payment Tracking</p>
                        <p className="text-sm text-black/40 font-medium">Track all your payments</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-black/10 bg-white text-center">
                        <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-6 h-6 text-black/60" />
                        </div>
                        <p className="font-[family-name:var(--font-anton)] text-lg text-black mb-1">Payment History</p>
                        <p className="text-sm text-black/40 font-medium">View past transactions</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-black/10 bg-white text-center">
                        <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-6 h-6 text-black/60" />
                        </div>
                        <p className="font-[family-name:var(--font-anton)] text-lg text-black mb-1">Reminders</p>
                        <p className="text-sm text-black/40 font-medium">Payment notifications</p>
                    </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-12 px-6 py-2.5 rounded-full bg-black text-white text-sm font-bold tracking-wide uppercase">
                    Coming Soon
                </div>
            </div>
        </div>
    )
}
