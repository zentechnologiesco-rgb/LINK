'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, BedDouble, Bath, Square } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'

interface PropertyCardProps {
    property: {
        id: string
        title: string
        price: number
        address: string
        bedrooms: number
        bathrooms: number
        size: number
        images: string[]
        type: string
        monthly_rent?: number
        isSaved?: boolean
    }
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Link href={`/properties/${property.id}`}>
            <Card className="group overflow-hidden rounded-xl border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer h-full flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                        src={property.images[0] || '/window.svg'}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute right-3 top-3 z-10">
                        <SavePropertyButton
                            propertyId={property.id}
                            initialSaved={property.isSaved}
                        />
                    </div>

                    <div className="absolute left-3 top-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black font-medium border-0 px-2 py-0.5 mt-0">
                            {property.type}
                        </Badge>
                    </div>
                </div>

                <CardContent className="flex-1 p-4 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <h3 className="font-semibold text-lg leading-tight tracking-tight text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                                {property.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground mt-1">
                                <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
                                <span className="text-sm truncate">{property.address}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-bold text-lg text-zinc-900">
                                N$ {property.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">/ month</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                        <div className="flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4 text-zinc-500" />
                            <span>{property.bedrooms} Beds</span>
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-zinc-500" />
                            <span>{property.bathrooms} Baths</span>
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <div className="flex items-center gap-1.5">
                            <Square className="h-4 w-4 text-zinc-500" />
                            <span>{property.size} m²</span>
                        </div>
                    </div>
                </CardContent>
                {/* <CardFooter className="p-4 pt-0 text-sm text-muted-foreground border-t border-border/50 mt-auto"> */}
                {/* Optional Footer content like "Posted 2 days ago" */}
                {/* </CardFooter> */}
            </Card>
        </Link>
    )
}
