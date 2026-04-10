'use client'
import { Lock, Plus, Trash2 } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface LeaseClause {
    id: string
    title: string
    content: string
    isMandatory?: boolean
}

interface LeaseClauseEditorProps {
    clauses: LeaseClause[]
    onChange: (clauses: LeaseClause[]) => void
    disabled?: boolean
}

const titleInputClassName =
    'h-12 rounded-[16px] border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-900 shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10'

const contentInputClassName =
    'min-h-[120px] resize-none rounded-[20px] border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-700 shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10'

export function LeaseClauseEditor({ clauses, onChange, disabled }: LeaseClauseEditorProps) {
    const mandatoryClauses = clauses.filter((clause) => clause.isMandatory)
    const editableClauses = clauses.filter((clause) => !clause.isMandatory)

    const addClause = () => {
        onChange([
            ...clauses,
            {
                id: `custom_${Date.now()}`,
                title: '',
                content: '',
                isMandatory: false,
            },
        ])
    }

    const updateClause = (id: string, updates: Partial<LeaseClause>) => {
        onChange(clauses.map((clause) => (clause.id === id ? { ...clause, ...updates } : clause)))
    }

    const removeClause = (id: string) => {
        if (clauses.find((clause) => clause.id === id)?.isMandatory) {
            return
        }

        onChange(clauses.filter((clause) => clause.id !== id))
    }

    return (
        <div className="space-y-10">
            {mandatoryClauses.length > 0 && (
                <section>
                    <SectionHeader
                        title="Required clauses"
                        description="These stay locked so every lease keeps the essential legal and operational language."
                    />

                    <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                        {mandatoryClauses.map((clause, index) => (
                            <div key={clause.id} className="flex items-start gap-4 px-4 py-4 sm:px-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-900">
                                    {index + 1}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-neutral-950">{clause.title}</p>
                                        <Lock className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-neutral-600">{clause.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <div className="flex items-center justify-between gap-4">
                    <SectionHeader
                        title={editableClauses.length > 0 ? 'Additional clauses' : 'Custom clauses'}
                        description="Add the terms that make this lease specific to the property or tenant."
                    />

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addClause}
                        disabled={disabled}
                        className="h-10 rounded-full border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-700 shadow-none hover:bg-neutral-100"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.1} />
                        Add clause
                    </Button>
                </div>

                {editableClauses.length === 0 ? (
                    <button
                        type="button"
                        onClick={addClause}
                        disabled={disabled}
                        className="mt-4 w-full border-y border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-12 text-center transition-colors hover:bg-neutral-50"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500">
                            <Plus className="h-5 w-5" strokeWidth={2.1} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-neutral-900">Add a custom clause</p>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">
                            Examples: guest limits, quiet hours, garden maintenance, or move-out cleaning.
                        </p>
                    </button>
                ) : (
                    <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                        {editableClauses.map((clause, index) => (
                            <div
                                key={clause.id}
                                className="px-0 py-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-900">
                                        {mandatoryClauses.length + index + 1}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <Input
                                            value={clause.title}
                                            onChange={(event) => updateClause(clause.id, { title: event.target.value })}
                                            disabled={disabled}
                                            placeholder="Clause title"
                                            className={titleInputClassName}
                                        />
                                        <Textarea
                                            value={clause.content}
                                            onChange={(event) => updateClause(clause.id, { content: event.target.value })}
                                            disabled={disabled}
                                            placeholder="Write the full clause here."
                                            rows={4}
                                            className={contentInputClassName}
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeClause(clause.id)}
                                        disabled={disabled}
                                        className="h-10 w-10 rounded-full text-neutral-400 shadow-none hover:bg-neutral-50 hover:text-neutral-900"
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function SectionHeader({
    title,
    description,
}: {
    title: string
    description: string
}) {
    return (
        <div>
            <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
        </div>
    )
}
