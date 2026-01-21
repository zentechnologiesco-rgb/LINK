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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const idFrontFile = formData.get('id_front') as File
        const idBackFile = formData.get('id_back') as File

        try {
            // 1. Upload ID Front
            const postUrl1 = await generateUploadUrl()
            const result1 = await fetch(postUrl1, {
                method: "POST",
                headers: { "Content-Type": idFrontFile.type },
                body: idFrontFile,
            })
            if (!result1.ok) throw new Error("Failed to upload ID front")
            const { storageId: idFrontStorageId } = await result1.json()

            // 2. Upload ID Back
            const postUrl2 = await generateUploadUrl()
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
        <div className="space-y-6">
            {/* Rejection Notice */}
            {rejectionReason && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-800 mb-1">Previous Application Rejected</h4>
                            <p className="text-sm text-amber-700">{rejectionReason}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800 mb-1">Resubmit Your Application</h4>
                        <p className="text-sm text-blue-700">
                            Please address the issues mentioned above and resubmit your application with the corrected information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="id_type">ID Type</Label>
                            <Select name="id_type" required defaultValue={previousData.id_type || 'national_id'}>
                                <SelectTrigger>
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
                            <Label htmlFor="id_number">ID Number</Label>
                            <Input
                                id="id_number"
                                name="id_number"
                                placeholder="Enter ID number"
                                defaultValue={previousData.id_number || ''}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name (Optional)</Label>
                        <Input
                            id="business_name"
                            name="business_name"
                            placeholder="If you operate as a business"
                            defaultValue={previousData.business_name || ''}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_registration">Business Registration Number (Optional)</Label>
                        <Input
                            id="business_registration"
                            name="business_registration"
                            placeholder="e.g. CC/2024/00001"
                            defaultValue={previousData.business_registration || ''}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Document Verification</h3>
                            <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                New Upload Required
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Please upload clear, legible images of your ID documents.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="id_front" className="text-xs font-medium text-gray-700">ID Document (Front)</Label>
                                <div className="relative group">
                                    <Input
                                        id="id_front"
                                        name="id_front"
                                        type="file"
                                        accept="image/*,.pdf"
                                        required
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer text-xs"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500">Upload the front side of your ID card, license, or passport.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="id_back" className="text-xs font-medium text-gray-700">ID Document (Back)</Label>
                                <div className="relative group">
                                    <Input
                                        id="id_back"
                                        name="id_back"
                                        type="file"
                                        accept="image/*,.pdf"
                                        required
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer text-xs"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500">Upload the back side or signature page.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Your resubmission will be reviewed by our team</li>
                        <li>Make sure to address all issues from the rejection</li>
                        <li>Once approved, you'll be able to list properties</li>
                    </ul>
                </div>

                <Button type="submit" className="w-full bg-black hover:bg-zinc-800" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Resubmitting...' : 'Resubmit Application'}
                </Button>
            </form>
        </div>
    )
}
