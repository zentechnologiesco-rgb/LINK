'use client'

import Link from 'next/link'
import { ChevronLeft, Clock3, FileText, ShieldCheck } from '@/components/ui/icons'

import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUser } from '@/components/providers/UserProvider'

type LegalSection = {
    title: string
    paragraphs: string[]
    bullets?: string[]
}

type LegalDocumentPageProps = {
    eyebrow: string
    title: string
    description: string
    lastUpdated: string
    highlights: string[]
    sections: LegalSection[]
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export function LegalDocumentPage({
    eyebrow,
    title,
    description,
    lastUpdated,
    highlights,
    sections,
}: LegalDocumentPageProps) {
    const { user, isLoading } = useUser()

    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <Header user={user} userRole={user?.role} isLoading={isLoading} />

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8">
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
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                <span className="font-semibold uppercase tracking-[0.18em] text-neutral-900">
                                    {eyebrow}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Clock3 className="h-4 w-4" />
                                    Last updated {lastUpdated}
                                </span>
                            </div>

                            <div className="max-w-3xl">
                                <h1 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl lg:text-[3.25rem]">
                                    {title}
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
                                    {description}
                                </p>
                            </div>

                            <ul className="max-w-3xl space-y-3 border-l border-neutral-200 pl-4 text-sm leading-6 text-neutral-600 sm:text-[15px]">
                                {highlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>

                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
                    <section>
                        <div className="space-y-8">
                            {sections.map((section) => {
                                const sectionId = slugify(section.title)

                                return (
                                    <article
                                        key={section.title}
                                        id={sectionId}
                                        className="scroll-mt-28 border-b border-neutral-200 pb-8 last:border-b-0 last:pb-0"
                                    >
                                        <h2 className="mb-4 text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                                            {section.title}
                                        </h2>

                                        <div className="space-y-4 text-[15px] leading-7 text-neutral-700 sm:text-base">
                                            {section.paragraphs.map((paragraph) => (
                                                <p key={paragraph}>{paragraph}</p>
                                            ))}

                                            {section.bullets ? (
                                                <ul className="space-y-3 pl-1">
                                                    {section.bullets.map((bullet) => (
                                                        <li key={bullet} className="flex gap-3">
                                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                                                            <span>{bullet}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </section>

                    <aside className="border-t border-neutral-200 pt-6 lg:sticky lg:top-28 lg:border-t-0 lg:pt-0">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-bold tracking-tight text-neutral-950">On this page</p>
                                <nav className="mt-3 space-y-2">
                                    {sections.map((section) => (
                                        <a
                                            key={section.title}
                                            href={`#${slugify(section.title)}`}
                                            className="flex items-start gap-3 py-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
                                        >
                                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                                            <span>{section.title}</span>
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            <div className="border-t border-neutral-200 pt-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" />
                                    <p className="text-sm leading-6 text-neutral-600">
                                        Questions about this information can be raised through LINK support from your account dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <MobileNav user={user} userRole={user?.role} />
        </div>
    )
}

export type { LegalSection }
