import { createPwaIcon } from '@/lib/pwa-icon'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return createPwaIcon(size.width)
}
