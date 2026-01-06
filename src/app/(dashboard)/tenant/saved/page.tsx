import { getSavedProperties } from '@/actions/saved-properties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default async function SavedPropertiesPage() {
    const { data: savedProperties, error } = await getSavedProperties()

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Error loading saved properties</h2>
                <p className="text-muted-foreground mb-4">
                    {error}
                </p>
                <Button asChild>
                    <Link href="/search">Browse Properties</Link>
                </Button>
            </div>
        )
    }

    if (!savedProperties || savedProperties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No saved properties yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Start exploring and save properties you're interested in to easily find them later.
                </p>
                <Button asChild>
                    <Link href="/search">Browse Properties</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Saved Properties</h1>
                <p className="text-muted-foreground">
                    Your collection of favorite homes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedProperties.map((property) => (
                    <div key={property.id} className="h-full">
                        <PropertyCard
                            property={{
                                id: property.id,
                                title: property.title,
                                price: property.price_nad,
                                address: property.address,
                                bedrooms: property.bedrooms,
                                bathrooms: property.bathrooms,
                                size: property.size_sqm,
                                images: property.images || [],
                                type: property.property_type,
                                monthly_rent: property.price_nad,
                                isSaved: true // These are all saved
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
