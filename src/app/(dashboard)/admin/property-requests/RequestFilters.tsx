'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { useState, useTransition, useCallback } from 'react'

interface RequestFiltersProps {
    currentStatus: 'all' | 'pending' | 'approved' | 'rejected'
    currentSearch: string
}

const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
]

export function RequestFilters({ currentStatus, currentSearch }: RequestFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [searchValue, setSearchValue] = useState(currentSearch)

    const updateParams = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (value && value !== 'all') {
            params.set(key, value)
        } else {
            params.delete(key)
        }

        startTransition(() => {
            router.push(`/admin/property-requests?${params.toString()}`)
        })
    }, [router, searchParams])

    const handleStatusChange = (status: string) => {
        updateParams('status', status)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams('search', searchValue)
    }

    const clearSearch = () => {
        setSearchValue('')
        updateParams('search', '')
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Status Filter */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {statusOptions.map((option) => (
                    <Button
                        key={option.value}
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(option.value)}
                        className={cn(
                            'rounded-md',
                            currentStatus === option.value
                                ? 'bg-white shadow-sm hover:bg-white'
                                : 'hover:bg-gray-200/50'
                        )}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, city, or address..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-9 pr-8"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button type="submit" disabled={isPending}>
                    Search
                </Button>
            </form>
        </div>
    )
}
