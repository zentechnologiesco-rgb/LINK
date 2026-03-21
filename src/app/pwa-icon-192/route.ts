import { createPwaIcon } from '@/lib/pwa-icon'

export const runtime = 'edge'

export async function GET() {
  return createPwaIcon(192)
}
