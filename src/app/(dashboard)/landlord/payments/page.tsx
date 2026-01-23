'use client'

import { Clock, CreditCard, BarChart3, Bell } from 'lucide-react'

export default function LandlordPaymentsPage() {
    return (
        <div className="px-6 py-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
                <p className="text-muted-foreground mt-1">Manage rent payments and deposits</p>
            </div>

            {/* Coming Soon Card */}
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl bg-sidebar-accent/30 min-h-[50vh]">
                {/* Icon */}
                <div className="h-16 w-16 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-6">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-2">Payment Management</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                    We're building a powerful payment management system to help you track rent payments,
                    manage deposits, and get insights into your rental income.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
                    <div className="p-4 rounded-xl bg-background text-center">
                        <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center mx-auto mb-3">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Payment Tracking</p>
                        <p className="text-xs text-muted-foreground mt-1">Monitor all rent payments</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background text-center">
                        <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center mx-auto mb-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Analytics</p>
                        <p className="text-xs text-muted-foreground mt-1">Income insights & reports</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background text-center">
                        <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Reminders</p>
                        <p className="text-xs text-muted-foreground mt-1">Automated notifications</p>
                    </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-8 px-5 py-2.5 rounded-full bg-lime-500 text-white text-sm font-medium shadow-lg shadow-lime-500/20">
                    Coming Soon
                </div>
            </div>
        </div>
    )
}
