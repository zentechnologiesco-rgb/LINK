'use client'

import { useState } from 'react'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { cn } from '@/lib/utils'
import {
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    Wallet
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export default function LandlordPaymentsPage() {
    const payments = useQuery(api.payments.getForLandlord)
    const stats = useQuery(api.payments.getLandlordStats)
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')

    if (!payments || !stats) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading payments...</p>
                </div>
            </div>
        )
    }

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true
        return p.status === filter
    })

    return (
        <div className="relative min-h-[80vh]">
            {/* Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[3rem]">
                <div className="bg-black text-white p-12 rounded-[2.5rem] text-center shadow-2xl max-w-lg mx-4 border border-white/10">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="font-[family-name:var(--font-anton)] text-4xl mb-4 tracking-wide uppercase">Coming Soon</h2>
                    <p className="text-white/60 font-medium">
                        We're putting the final touches on the advanced payment dashboard. Check back shortly for updates.
                    </p>
                </div>
            </div>

            {/* Existing Content (Blurred & Disabled) */}
            <div className="px-8 py-10 max-w-[1600px] mx-auto pb-24 opacity-40 pointer-events-none filter blur-[2px] UserSelect-none">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide text-black leading-none">
                            Payments
                        </h1>
                        <p className="text-black/60 font-medium text-base">
                            Track rental income, manage deposits, and monitor transaction history.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-full h-12 px-6 font-bold uppercase tracking-wider text-xs border-black/10 hover:bg-black/5 hover:text-black transition-all">
                            <Filter className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        label="Total Collected"
                        value={stats.totalCollected}
                        icon={Wallet}
                        highlight
                    />
                    <StatCard
                        label="Pending Income"
                        value={stats.pending}
                        icon={Clock}
                    />
                    <StatCard
                        label="Overdue Payments"
                        value={stats.overdue}
                        icon={AlertCircle}
                        isError={stats.overdue > 0}
                    />
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/5 overflow-hidden">
                    {/* Filters */}
                    <div className="p-8 border-b border-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 p-1.5 bg-black/[0.03] rounded-full">
                            {['all', 'paid', 'pending', 'overdue'].map((f) => (
                                <button
                                    key={f}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                                        filter === f
                                            ? "bg-black text-white shadow-lg shadow-black/10"
                                            : "text-black/40 hover:text-black hover:bg-black/5"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-auto min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                            <Input
                                placeholder="Search by tenant or property..."
                                className="pl-11 h-12 rounded-full border-black/5 bg-black/[0.02] focus-visible:ring-black/5 text-sm font-medium placeholder:text-black/30 w-full"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-black/5">
                        {filteredPayments.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="h-16 w-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Wallet className="h-6 w-6 text-black/20" />
                                </div>
                                <h3 className="font-[family-name:var(--font-anton)] text-xl text-black/40 uppercase tracking-wide">No payments found</h3>
                            </div>
                        ) : (
                            filteredPayments.map((payment) => (
                                <div key={payment._id} className="p-6 md:p-8 hover:bg-black/[0.01] transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-5">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border",
                                            payment.status === 'paid' ? "bg-black text-white border-black" :
                                                payment.status === 'overdue' ? "bg-white text-black border-black/10" :
                                                    "bg-black/[0.03] text-black/60 border-transparent"
                                        )}>
                                            {payment.status === 'paid' && <CheckCircle2 className="h-6 w-6" />}
                                            {payment.status === 'pending' && <Clock className="h-6 w-6" />}
                                            {payment.status === 'overdue' && <AlertCircle className="h-6 w-6" />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg text-black">
                                                    {payment.lease?.tenant?.fullName || 'Unknown Tenant'}
                                                </h3>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.05] text-black/50 uppercase tracking-wider">
                                                    {payment.type}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-black/40">
                                                {payment.lease?.property?.title || 'Unknown Property'} • Due {new Date(payment.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-8 pl-[4.75rem] md:pl-0">
                                        <div className="text-right">
                                            <p className="font-[family-name:var(--font-anton)] text-2xl text-black">
                                                N$ {payment.amount.toLocaleString()}
                                            </p>
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                payment.status === 'paid' ? "text-black/40" :
                                                    payment.status === 'overdue' ? "text-black font-extrabold" :
                                                        "text-black/40"
                                            )}>
                                                {payment.status === 'paid' ? `Paid on ${new Date(payment.paidAt!).toLocaleDateString()}` : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                            </p>
                                        </div>

                                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-black hover:text-white transition-colors">
                                            <ArrowUpRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, highlight, isError }: { label: string; value: number; icon: any; highlight?: boolean; isError?: boolean }) {
    return (
        <div className={cn(
            "p-8 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group",
            highlight
                ? "bg-black border-black text-white shadow-xl shadow-black/20"
                : "bg-white border-black/5 text-black hover:border-black/10 hover:shadow-xl hover:shadow-black/5"
        )}>
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        highlight ? "text-white/60" : "text-black/40"
                    )}>
                        {label}
                    </p>
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        highlight ? "bg-white/10 text-white" : "bg-black/5 text-black/40 group-hover:bg-black group-hover:text-white transition-colors"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <p className={cn(
                    "font-[family-name:var(--font-anton)] text-5xl",
                    isError ? "text-black" : (highlight ? "text-white" : "text-black")
                )}>
                    N$ {value.toLocaleString()}
                </p>
            </div>
        </div>
    )
}
