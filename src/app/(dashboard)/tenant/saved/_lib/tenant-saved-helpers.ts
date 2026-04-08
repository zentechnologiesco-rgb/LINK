export type TenantSavedSortId = 'newest' | 'price-low' | 'price-high'

export const SORT_OPTIONS: { id: TenantSavedSortId; label: string }[] = [
    { id: 'newest', label: 'Recently Saved' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
]

export function sortSavedProperties<T extends { price: number }>(
    properties: T[],
    sortBy: TenantSavedSortId
) {
    const result = [...properties]

    switch (sortBy) {
        case 'price-low':
            result.sort((left, right) => left.price - right.price)
            break
        case 'price-high':
            result.sort((left, right) => right.price - left.price)
            break
        default:
            break
    }

    return result
}
