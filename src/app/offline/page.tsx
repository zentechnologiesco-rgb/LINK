import Link from 'next/link'
import { ChevronLeft, RefreshCw, WifiOff } from '@/components/ui/icons'

const highlights = [
  'Fresh listings need an internet connection to load.',
  'Messages and lease activity will update once you are back online.',
  'You can retry the home page as soon as the connection returns.',
]

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 pb-24 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <section className="border-b border-neutral-200 pb-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span className="font-semibold uppercase tracking-[0.18em] text-neutral-900">
                  Offline
                </span>
              </div>

              <div className="max-w-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
                  <WifiOff className="h-5 w-5" strokeWidth={2.2} />
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                  You are offline right now.
                </h1>

                <p className="mt-4 text-base leading-7 text-neutral-600 sm:text-lg">
                  LINK needs an internet connection to refresh the feed, messages, and
                  lease updates.
                </p>
              </div>

              <ul className="max-w-3xl space-y-3 border-l border-neutral-200 pl-4 text-sm leading-6 text-neutral-600 sm:text-[15px]">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.2} />
                  Retry home page
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
