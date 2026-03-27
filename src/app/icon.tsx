import { createPwaIcon } from '@/lib/pwa-icon'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return createPwaIcon(size.width)
}
