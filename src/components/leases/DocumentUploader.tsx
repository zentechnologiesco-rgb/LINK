'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
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

export interface DocumentFile {
    type: 'id_front' | 'id_back' | 'payslip' | 'bank_statement' | 'employment_letter' | 'other'
    url: string
    name: string
    uploaded_at: string
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

    const supabase = createClient()

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
            const fileExt = file.name.split('.').pop()
            // Use leaseId as fallback if tenantId is empty
            const uploadPath = tenantId
                ? `${tenantId}/${leaseId}/${docType}_${Date.now()}.${fileExt}`
                : `${leaseId}/${docType}_${Date.now()}.${fileExt}`

            console.log('Uploading to path:', uploadPath)
            console.log('File size:', file.size, 'bytes')

            // Simulate progress (since Supabase doesn't provide upload progress)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 5, 90))
            }, 300)

            console.log('Starting upload...')
            const startTime = Date.now()

            // Add timeout to prevent hanging
            const uploadPromise = supabase.storage
                .from('lease_documents')
                .upload(uploadPath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000)
            )

            const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

            clearInterval(progressInterval)
            console.log('Upload completed in', Date.now() - startTime, 'ms')

            if (error) {
                console.error('Upload error:', error.message, error)
                if (error.message.includes('timeout')) {
                    toast.error('Upload timed out. Please try a smaller file or check your connection.')
                } else if (error.message.includes('security') || error.message.includes('policy')) {
                    toast.error('Upload permission denied. Please check storage policies.')
                } else if (error.message.includes('not found')) {
                    toast.error('Storage bucket not found. Please contact support.')
                } else {
                    toast.error(`Upload failed: ${error.message}`)
                }
                return
            }

            console.log('Upload successful, data:', data)
            setUploadProgress(100)

            // Get public URL (bucket should be set to public for reads)
            const { data: urlData } = supabase.storage
                .from('lease_documents')
                .getPublicUrl(data.path)

            const newDoc: DocumentFile = {
                type: docType,
                url: urlData.publicUrl,
                name: file.name,
                uploaded_at: new Date().toISOString()
            }

            // Remove existing document of same type and add new one
            const updatedDocs = documents.filter(d => d.type !== docType)
            updatedDocs.push(newDoc)
            onDocumentsChange(updatedDocs)

            toast.success(`${documentTypes.find(d => d.type === docType)?.label} uploaded successfully!`)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload document. Please try again.')
        } finally {
            setUploading(null)
            setUploadProgress(0)
        }
    }, [tenantId, leaseId, documents, onDocumentsChange, supabase])

    const removeDocument = useCallback(async (docType: DocumentFile['type']) => {
        const doc = documents.find(d => d.type === docType)
        if (!doc) return

        try {
            // Extract file path from URL
            const urlParts = doc.url.split('/lease_documents/')
            if (urlParts.length > 1) {
                await supabase.storage
                    .from('lease_documents')
                    .remove([urlParts[1]])
            }

            const updatedDocs = documents.filter(d => d.type !== docType)
            onDocumentsChange(updatedDocs)
            toast.success('Document removed')
        } catch (error) {
            console.error('Remove error:', error)
            toast.error('Failed to remove document')
        }
    }, [documents, onDocumentsChange, supabase])

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
                                                    {uploadedDoc.name}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG, WebP, or PDF (max 5MB)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {uploadedDoc && (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(uploadedDoc.url, '_blank')}
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
