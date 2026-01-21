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
    Eye
} from 'lucide-react'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

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
    // We can't delete files directly easily without knowing if they are used elsewhere, 
    // but here we can probably just unlink them. 
    // Actually, we should probably delete from storage if we replace/remove.
    // Ideally we'd have a specific mutation for this, but general remove is fine.
    // Note: The caller needs to update the lease object with the new document list.

    // Get URLs for all documents
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

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF.')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB.')
            return
        }

        setUploading(docType)
        setUploadProgress(0)

        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl()

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error(`Upload failed: ${result.statusText}`)
            }

            const { storageId } = await result.json()

            // 3. Update documents list
            const newDoc: DocumentFile = {
                type: docType,
                storageId: storageId as Id<"_storage">,
                uploadedAt: new Date().toISOString()
            }

            // Remove existing document of same type and add new one
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Required Documents</Label>
                {completedRequired && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="h-4 w-4" />
                        All required documents uploaded
                    </div>
                )}
            </div>

            <div className="grid gap-3">
                {documentTypes.map(({ type, label, icon: Icon, required }) => {
                    const uploadedDoc = getDocumentByType(type)
                    const isUploading = uploading === type
                    const isRequired = requiredDocuments.includes(type as any)
                    const url = uploadedDoc ? urlMap.get(uploadedDoc.storageId) : null

                    return (
                        <Card
                            key={type}
                            className={`transition-all ${uploadedDoc
                                ? 'border-green-200 bg-green-50/50'
                                : isRequired
                                    ? 'border-orange-200 bg-orange-50/30'
                                    : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${uploadedDoc
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {uploadedDoc ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {label}
                                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                                            </p>
                                            {uploadedDoc ? (
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
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
                                                    size="sm"
                                                    onClick={() => window.open(url, '_blank')}
                                                    className="text-blue-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeDocument(type)}
                                                    disabled={disabled}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}

                                        <label className={`cursor-pointer ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
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
                                            <Button
                                                type="button"
                                                variant={uploadedDoc ? 'outline' : 'default'}
                                                size="sm"
                                                disabled={disabled || isUploading}
                                                asChild
                                            >
                                                <span>
                                                    {isUploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 mr-1" />
                                                            {uploadedDoc ? 'Replace' : 'Upload'}
                                                        </>
                                                    )}
                                                </span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>

                                {isUploading && (
                                    <Progress value={uploadProgress} className="mt-3 h-1" />
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <p className="text-xs text-muted-foreground">
                <span className="text-red-500">*</span> Required documents must be uploaded before signing
            </p>
        </div>
    )
}
