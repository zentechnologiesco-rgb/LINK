'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Lock, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeaseClause {
    id: string
    title: string
    content: string
    isMandatory?: boolean
}

interface ClauseEditorProps {
    clauses: LeaseClause[]
    onChange: (clauses: LeaseClause[]) => void
    disabled?: boolean
}

export function ClauseEditor({ clauses, onChange, disabled }: ClauseEditorProps) {
    const mandatoryClauses = clauses.filter((c) => c.isMandatory)
    const editableClauses = clauses.filter((c) => !c.isMandatory)

    const addClause = () => {
        const newClause: LeaseClause = {
            id: `custom_${Date.now()}`,
            title: '',
            content: '',
            isMandatory: false,
        }
        onChange([...clauses, newClause])
    }

    const updateClause = (id: string, updates: Partial<LeaseClause>) => {
        onChange(
            clauses.map((c) => (c.id === id ? { ...c, ...updates } : c))
        )
    }

    const removeClause = (id: string) => {
        const clause = clauses.find((c) => c.id === id)
        if (clause?.isMandatory) return
        onChange(clauses.filter((c) => c.id !== id))
    }

    return (
        <div className="space-y-6">
            {/* Mandatory Clauses */}
            {mandatoryClauses.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Lock className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                            Mandatory Clauses (Legally Required)
                        </span>
                    </div>
                    <div className="space-y-2">
                        {mandatoryClauses.map((clause, index) => (
                            <div
                                key={clause.id}
                                className="relative border border-neutral-100 rounded-xl p-4 bg-neutral-50/50"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-neutral-900 text-white text-xs font-bold shrink-0 mt-0.5">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm text-neutral-900">
                                                {clause.title}
                                            </h4>
                                            <Lock className="h-3 w-3 text-neutral-300" />
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            {clause.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Editable Clauses */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                        {editableClauses.length > 0 ? 'Additional Clauses' : 'Custom Clauses'}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addClause}
                        disabled={disabled}
                        className="h-8 bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg text-xs"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Clause
                    </Button>
                </div>

                {editableClauses.length === 0 ? (
                    <button
                        type="button"
                        onClick={addClause}
                        disabled={disabled}
                        className="w-full border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-neutral-300 hover:bg-neutral-50 transition-colors group"
                    >
                        <Plus className="h-5 w-5 text-neutral-300 mx-auto mb-2 group-hover:text-neutral-500 transition-colors" />
                        <p className="text-sm font-medium text-neutral-400 group-hover:text-neutral-600 transition-colors">
                            Add a custom clause
                        </p>
                        <p className="text-xs text-neutral-300 mt-0.5">
                            e.g., quiet hours, guest policies, garden maintenance
                        </p>
                    </button>
                ) : (
                    <div className="space-y-3">
                        {editableClauses.map((clause, index) => (
                            <div
                                key={clause.id}
                                className="relative border border-neutral-200 rounded-xl p-4 bg-white hover:border-neutral-300 transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-neutral-200 text-neutral-600 text-xs font-bold shrink-0 mt-0.5">
                                        {mandatoryClauses.length + index + 1}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={clause.title}
                                            onChange={(e) =>
                                                updateClause(clause.id, { title: e.target.value })
                                            }
                                            disabled={disabled}
                                            placeholder="Clause title..."
                                            className="font-semibold border-0 px-0 h-auto text-sm focus-visible:ring-0 bg-transparent text-neutral-900 placeholder:text-neutral-300"
                                        />
                                        <Textarea
                                            value={clause.content}
                                            onChange={(e) =>
                                                updateClause(clause.id, { content: e.target.value })
                                            }
                                            disabled={disabled}
                                            placeholder="Clause content..."
                                            rows={3}
                                            className="resize-none border-neutral-200 focus-visible:ring-neutral-900 bg-neutral-50 rounded-lg text-xs text-neutral-600 leading-relaxed"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeClause(clause.id)}
                                        disabled={disabled}
                                        className="text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
