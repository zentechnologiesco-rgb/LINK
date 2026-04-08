'use client'

import { Loader2 } from 'lucide-react'

export function LeaseWorkspaceSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-16 font-sans">
            <div className="border-b border-neutral-200/60 px-5 pt-4 sm:px-6">
                <div className="flex items-center justify-between pb-1">
                    <div>
                        <div className="h-3.5 w-24 rounded-full bg-neutral-200/70" />
                        <div className="mt-2.5 h-8 w-28 rounded-xl bg-neutral-200/70" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-neutral-200/70" />
                </div>

                <div className="flex gap-2 py-2.5">
                    {[80, 64, 96].map((width) => (
                        <div
                            key={width}
                            className="h-8 rounded-full bg-neutral-200/60"
                            style={{ width }}
                        />
                    ))}
                </div>

                <div className="flex gap-1.5 pb-3 pt-1">
                    {[48, 110, 90, 64, 72].map((width) => (
                        <div
                            key={width}
                            className="h-9 rounded-full bg-neutral-200/60"
                            style={{ width }}
                        />
                    ))}
                </div>
            </div>

            <div className="px-4 pt-4 sm:px-6">
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                    {[1, 2, 3, 4, 5].map((index) => (
                        <div key={index}>
                            <div className="flex items-center gap-3.5 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                                <div className="h-[52px] w-[52px] shrink-0 rounded-2xl bg-neutral-100 sm:h-[58px] sm:w-[58px]" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-32 rounded-full bg-neutral-100" />
                                        <div className="h-4 w-14 rounded-full bg-neutral-100" />
                                    </div>
                                    <div className="h-3.5 w-48 rounded-full bg-neutral-100" />
                                    <div className="h-3 w-24 rounded-full bg-neutral-50" />
                                </div>
                                <div className="h-4 w-4 rounded-full bg-neutral-100" />
                            </div>
                            {index < 5 ? (
                                <div className="ml-[76px] border-t border-neutral-100 sm:ml-[88px]" />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center pt-6">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
            </div>
        </div>
    )
}

