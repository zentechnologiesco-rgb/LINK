import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="mx-auto flex max-w-md flex-col items-start gap-6 rounded-[32px] border border-black/10 bg-neutral-50 p-8 shadow-sm">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-2xl font-black tracking-tight text-[#a9ff3c]">
          L
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
            Offline
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black">
            You are offline right now.
          </h1>
          <p className="text-sm leading-6 text-black/65">
            LINK could not reach the internet. Reconnect to keep browsing properties, leases,
            and messages.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Retry home page
        </Link>
      </div>
    </main>
  )
}
