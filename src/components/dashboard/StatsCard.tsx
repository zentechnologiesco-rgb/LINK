import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string
    trend?: {
        value: string
        direction: 'up' | 'down'
        label: string
    }
    subtitle?: string
    className?: string
}

export function StatsCard({ title, value, trend, subtitle, className }: StatsCardProps) {
    return (
        <Card className={cn('bg-white border border-gray-200 shadow-sm', className)}>
            <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">{title}</span>
                    {trend && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                                trend.direction === 'up'
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-red-700 bg-red-50'
                            )}
                        >
                            {trend.direction === 'up' ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {value}
                </div>
                {trend && (
                    <p
                        className={cn(
                            'text-sm flex items-center gap-1',
                            trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                        )}
                    >
                        <span>{trend.label}</span>
                        {trend.direction === 'up' ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                        )}
                    </p>
                )}
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    )
}
