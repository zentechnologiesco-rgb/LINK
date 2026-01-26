'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
    Upload,
    X,
    FileText,
    CreditCard,
    Receipt,
    Building2,
    Check,
    Loader2,
    Eye,
    AlertCircle
} from 'lucide-react'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

export interface DocumentFile {
    type: 'id_front' | 'id_back' | 'payslip' | 'bank_statement' | 'employment_letter' | 'other'
    storageId: Id<"_storage">
    uploadedAt: string
}

interface DocumentUploaderProps {
    tenantId: string
    leaseId: string
    documents: DocumentFile[]
    onDocumentsChange: (documents: DocumentFile[]) => void
    disabled?: boolean
    requiredDocuments?: ('id_front' | 'id_back' | 'payslip' | 'bank_statement')[]
}

const documentTypes = [
    { type: 'id_front' as const, label: 'ID Front', icon: CreditCard, required: true },
    { type: 'id_back' as const, label: 'ID Back', icon: CreditCard, required: true },
    { type: 'payslip' as const, label: 'Latest Payslip', icon: Receipt, required: false },
    { type: 'bank_statement' as const, label: 'Bank Statement', icon: Building2, required: false },
    { type: 'employment_letter' as const, label: 'Employment Letter', icon: FileText, required: false },
]

export function DocumentUploader({
    tenantId,
    leaseId,
    documents,
    onDocumentsChange,
    disabled,
    requiredDocuments = ['id_front', 'id_back']
}: DocumentUploaderProps) {
    const [uploading, setUploading] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const storageIds = documents.map(d => d.storageId)
    const urls = useQuery(api.files.getUrls, { storageIds })

    const urlMap = new Map<string, string>()
    if (urls) {
        urls.forEach(({ id, url }) => {
            if (url) urlMap.set(id, url)
        })
    }

    const uploadDocument = useCallback(async (
        file: File,
        docType: DocumentFile['type']
    ) => {
        if (!file) return

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB.')
            return
        }

        setUploading(docType)
        setUploadProgress(0)

        try {
            const postUrl = await generateUploadUrl()
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error(`Upload failed: ${result.statusText}`)
            }

            const { storageId } = await result.json()

            const newDoc: DocumentFile = {
                type: docType,
                storageId: storageId as Id<"_storage">,
                uploadedAt: new Date().toISOString()
            }

            const updatedDocs = documents.filter(d => d.type !== docType)
            updatedDocs.push(newDoc)
            onDocumentsChange(updatedDocs)

            toast.success(`${documentTypes.find(d => d.type === docType)?.label} uploaded successfully!`)
            setUploadProgress(100)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload document. Please try again.')
        } finally {
            setUploading(null)
            setUploadProgress(0)
        }
    }, [documents, onDocumentsChange, generateUploadUrl])

    const removeDocument = useCallback(async (docType: DocumentFile['type']) => {
        const updatedDocs = documents.filter(d => d.type !== docType)
        onDocumentsChange(updatedDocs)
        toast.success('Document removed')
    }, [documents, onDocumentsChange])

    const getDocumentByType = (type: DocumentFile['type']) => {
        return documents.find(d => d.type === type)
    }

    const completedRequired = requiredDocuments.every(type => getDocumentByType(type))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Label className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-lg text-black">
                    Required Documents
                </Label>
                {completedRequired && (
                    <div className="flex items-center gap-2 text-black text-xs font-bold uppercase tracking-wider bg-black/5 px-3 py-1.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Complete
                    </div>
                )}
            </div>

            <div className="grid gap-4">
                {documentTypes.map(({ type, label, icon: Icon, required }) => {
                    const uploadedDoc = getDocumentByType(type)
                    const isUploading = uploading === type
                    const isRequired = requiredDocuments.includes(type as any)
                    const url = uploadedDoc ? urlMap.get(uploadedDoc.storageId) : null

                    return (
                        <Card
                            key={type}
                            className={cn(
                                "border transition-all duration-200 border-black/5",
                                uploadedDoc ? "bg-white shadow-sm" : "bg-white hover:bg-gray-50/50"
                            )}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                                            uploadedDoc ? "bg-black text-white" : "bg-black/5 text-black/40"
                                        )}>
                                            {uploadedDoc ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-black flex items-center gap-2">
                                                {label}
                                                {isRequired && !uploadedDoc && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 bg-black/5 px-2 py-0.5 rounded-full">Required</span>
                                                )}
                                            </p>
                                            {uploadedDoc ? (
                                                <p className="text-xs text-black/40 font-medium mt-0.5">
                                                    Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-black/40 mt-0.5">
                                                    JPG, PNG, WebP, or PDF (max 5MB)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {uploadedDoc && url && (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(url, '_blank')}
                                                    className="h-9 w-9 text-black/60 hover:text-black hover:bg-black/5 rounded-full"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeDocument(type)}
                                                    disabled={disabled}
                                                    className="h-9 w-9 text-black/40 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}

                                        <label className={cn("cursor-pointer", disabled && "pointer-events-none opacity-50")}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) uploadDocument(file, type)
                                                }}
                                                disabled={disabled || isUploading}
                                            />
                                            <div className={cn(
                                                "inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-bold uppercase tracking-wider rounded-full transition-all",
                                                uploadedDoc
                                                    ? "bg-white border border-black/10 text-black hover:bg-black/5"
                                                    : "bg-black text-white hover:bg-black/80 shadow-lg shadow-black/5"
                                            )}>
                                                {isUploading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Upload className="h-3 w-3" />
                                                        {uploadedDoc ? 'Replace' : 'Upload'}
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {isUploading && (
                                    <Progress value={uploadProgress} className="mt-4 h-1 bg-black/5" />
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="flex items-center gap-2 text-xs text-black/40 font-medium bg-black/5 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <p>Required documents must be uploaded before signing</p>
            </div>
        </div>
    )
}
