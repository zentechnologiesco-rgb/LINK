'use client'

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    LayoutGrid,
    Building2,
    Home,
    BedSingle,
    Square,
    Crown,
    Building,
    Store,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
} from 'lucide-react'

const categories = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'apartment', label: 'Apartments', icon: Building2 },
    { id: 'house', label: 'Houses', icon: Home },
    { id: 'room', label: 'Rooms', icon: BedSingle },
    { id: 'studio', label: 'Studios', icon: Square },
    { id: 'penthouse', label: 'Penthouses', icon: Crown },
    { id: 'townhouse', label: 'Townhouses', icon: Building },
    { id: 'commercial', label: 'Commercial', icon: Store },
]

interface CategoryBarProps {
    selectedCategory: string
    onCategoryChange: (category: string) => void
    className?: string
}

export function CategoryBar({ selectedCategory, onCategoryChange, className }: CategoryBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)

    const checkScrollButtons = () => {
        const container = scrollContainerRef.current
        if (container) {
            setShowLeftArrow(container.scrollLeft > 0)
            setShowRightArrow(
                container.scrollLeft < container.scrollWidth - container.clientWidth - 10
            )
        }
    }

    useEffect(() => {
        checkScrollButtons()
        window.addEventListener('resize', checkScrollButtons)
        return () => window.removeEventListener('resize', checkScrollButtons)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current
        if (container) {
            const scrollAmount = 200
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            })
        }
    }

    return (
        <div className={cn('relative bg-white border-b border-black/5', className)}>
            <div className="max-w-[2000px] mx-auto px-4 md:px-6">
                <div className="flex items-center gap-4">
                    {/* Scroll Left Button */}
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className="hidden md:flex absolute left-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-white border border-black/10 shadow-md shadow-black/5 hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}

                    {/* Categories Container */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={checkScrollButtons}
                        className="flex items-center gap-8 overflow-x-auto scrollbar-hide py-4 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {categories.map((category) => {
                            const isActive = selectedCategory === category.id
                            const Icon = category.icon

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => onCategoryChange(category.id)}
                                    className={cn(
                                        'flex flex-col items-center gap-2 min-w-fit px-1 py-2 transition-all duration-200 group relative',
                                        isActive
                                            ? 'text-black'
                                            : 'text-black/50 hover:text-black/80'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-6 w-6 transition-all',
                                            isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                                        )}
                                        strokeWidth={isActive ? 2 : 1.5}
                                    />
                                    <span
                                        className={cn(
                                            'text-xs whitespace-nowrap transition-all',
                                            isActive ? 'font-semibold' : 'font-medium'
                                        )}
                                    >
                                        {category.label}
                                    </span>

                                    {/* Active Indicator */}
                                    <div
                                        className={cn(
                                            'absolute -bottom-4 left-0 right-0 h-0.5 bg-black rounded-full transition-all',
                                            isActive ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                </button>
                            )
                        })}
                    </div>

                    {/* Scroll Right Button */}
                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className="hidden md:flex absolute right-20 z-10 h-8 w-8 items-center justify-center rounded-full bg-white border border-black/10 shadow-md shadow-black/5 hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}

                    {/* Filters Button */}
                    <Button
                        variant="outline"
                        className="hidden md:flex shrink-0 rounded-xl border-black/10 hover:border-black/20 gap-2 font-medium"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                </div>
            </div>
        </div>
    )
}
