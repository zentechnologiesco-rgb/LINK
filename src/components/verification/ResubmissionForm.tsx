'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface ResubmissionFormProps {
    previousRequestId: string
    previousData: {
        id_type?: string
        id_number?: string
        business_name?: string
        business_registration?: string
    }
    rejectionReason?: string
}

export function ResubmissionForm({ previousRequestId, previousData, rejectionReason }: ResubmissionFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const resubmitVerification = useMutation(api.verification.resubmit)

    // File validation constants
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']

    function validateFile(file: File, fieldName: string): void {
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`${fieldName}: File type '${file.type}' is not allowed. Please upload an image (JPEG, PNG, GIF, WebP, HEIC) or PDF.`)
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`${fieldName}: File size exceeds the maximum limit of 10MB.`)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const idFrontFile = formData.get('id_front') as File
        const idBackFile = formData.get('id_back') as File

        try {
            // Validate files before uploading
            validateFile(idFrontFile, 'ID Front')
            validateFile(idBackFile, 'ID Back')

            // 1. Upload ID Front
            const postUrl1 = await generateUploadUrl({
                contentType: idFrontFile.type,
                fileSize: idFrontFile.size,
            })
            const result1 = await fetch(postUrl1, {
                method: "POST",
                headers: { "Content-Type": idFrontFile.type },
                body: idFrontFile,
            })
            if (!result1.ok) throw new Error("Failed to upload ID front")
            const { storageId: idFrontStorageId } = await result1.json()

            // 2. Upload ID Back
            const postUrl2 = await generateUploadUrl({
                contentType: idBackFile.type,
                fileSize: idBackFile.size,
            })
            const result2 = await fetch(postUrl2, {
                method: "POST",
                headers: { "Content-Type": idBackFile.type },
                body: idBackFile,
            })
            if (!result2.ok) throw new Error("Failed to upload ID back")
            const { storageId: idBackStorageId } = await result2.json()

            // 3. Resubmit Verification
            await resubmitVerification({
                previousRequestId: previousRequestId as Id<"landlordRequests">,
                idType: formData.get('id_type') as any,
                idNumber: formData.get('id_number') as string,
                businessName: formData.get('business_name') as string || undefined,
                businessRegistration: formData.get('business_registration') as string || undefined,
                idFrontStorageId: idFrontStorageId as Id<"_storage">,
                idBackStorageId: idBackStorageId as Id<"_storage">,
            })

            toast.success('Application resubmitted successfully!')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to resubmit application")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Rejection Notice */}
            {rejectionReason && (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-red-900 mb-1">Previous Application Rejected</h4>
                            <p className="text-sm text-red-800/80 leading-relaxed font-medium">{rejectionReason}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 shadow-lg shadow-neutral-900/20">
                        <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-neutral-900 mb-1">Resubmit Your Application</h4>
                        <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                            Please address the issues mentioned above and resubmit your application with the corrected information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="id_type" className="text-neutral-900 font-medium">ID Type</Label>
                            <Select name="id_type" required defaultValue={previousData.id_type || 'national_id'}>
                                <SelectTrigger className="border-neutral-200 focus:ring-neutral-200">
                                    <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="national_id">Namibian ID</SelectItem>
                                    <SelectItem value="passport">Passport</SelectItem>
                                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="id_number" className="text-neutral-900 font-medium">ID Number</Label>
                            <Input
                                id="id_number"
                                name="id_number"
                                placeholder="Enter ID number"
                                defaultValue={previousData.id_number || ''}
                                required
                                className="border-neutral-200 focus:border-neutral-900 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_name" className="text-neutral-900 font-medium">Business Name (Optional)</Label>
                        <Input
                            id="business_name"
                            name="business_name"
                            placeholder="If you operate as a business"
                            defaultValue={previousData.business_name || ''}
                            className="border-neutral-200 focus:border-neutral-900 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_registration" className="text-neutral-900 font-medium">Business Registration Number (Optional)</Label>
                        <Input
                            id="business_registration"
                            name="business_registration"
                            placeholder="e.g. CC/2024/00001"
                            defaultValue={previousData.business_registration || ''}
                            className="border-neutral-200 focus:border-neutral-900 transition-colors"
                        />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-neutral-100 mt-8">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-neutral-900">Document Verification</h3>
                            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                New Upload Required
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-medium -mt-4">
                            Please upload clear, legible images of your ID documents.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="id_front" className="text-xs font-bold text-neutral-500 uppercase tracking-wide">ID Document (Front)</Label>
                                <div className="relative group">
                                    <Input
                                        id="id_front"
                                        name="id_front"
                                        type="file"
                                        accept="image/*,.pdf"
                                        required
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer text-xs border-dashed border-neutral-300 bg-neutral-50/50 text-neutral-500"
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium">Upload the front side of your ID card, license, or passport.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="id_back" className="text-xs font-bold text-neutral-500 uppercase tracking-wide">ID Document (Back)</Label>
                                <div className="relative group">
                                    <Input
                                        id="id_back"
                                        name="id_back"
                                        type="file"
                                        accept="image/*,.pdf"
                                        required
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer text-xs border-dashed border-neutral-300 bg-neutral-50/50 text-neutral-500"
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium">Upload the back side or signature page.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-100 p-5 rounded-xl text-sm">
                    <p className="font-bold text-neutral-900 text-lg mb-2">What happens next?</p>
                    <ul className="space-y-2 text-neutral-500">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                            Your resubmission will be reviewed by our team
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                            Make sure to address all issues from the rejection
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                            Once approved, you'll be able to list properties
                        </li>
                    </ul>
                </div>

                <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 h-12 rounded-xl text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-neutral-900/10" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Resubmitting...' : 'Resubmit Application'}
                </Button>
            </form>
        </div>
    )
}
