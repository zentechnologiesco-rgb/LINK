'use client'

import { Clock, CreditCard, BarChart3, Bell } from 'lucide-react'

export default function LandlordPaymentsPage() {
    return (
        <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Payments</h2>
                    <p className="text-sm text-gray-500">Manage rent payments and deposits.</p>
                </div>
            </div>

            {/* Coming Soon Card */}
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-white min-h-[60vh]">
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
                    <Clock className="h-8 w-8 text-gray-400" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Management</h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                    We're building a powerful payment management system to help you track rent payments,
                    manage deposits, and get insights into your rental income.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Payment Tracking</p>
                        <p className="text-xs text-gray-500 mt-1">Monitor all rent payments</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Analytics</p>
                        <p className="text-xs text-gray-500 mt-1">Income insights & reports</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Reminders</p>
                        <p className="text-xs text-gray-500 mt-1">Automated notifications</p>
                    </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-8 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium">
                    Coming Soon
                </div>
            </div>
        </div>
    )
}
