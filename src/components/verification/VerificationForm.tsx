
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

export function VerificationForm() {
    const [isLoading, setIsLoading] = useState(false)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const submitVerification = useMutation(api.verification.submit)

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

            // 3. Submit Verification
            await submitVerification({
                idType: formData.get('id_type') as any,
                idNumber: formData.get('id_number') as string,
                businessName: formData.get('business_name') as string || undefined,
                businessRegistration: formData.get('business_registration') as string || undefined,
                idFrontStorageId: idFrontStorageId as Id<"_storage">,
                idBackStorageId: idBackStorageId as Id<"_storage">,
            })

            toast.success('Verification request submitted!')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to submit verification")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="id_type">ID Type</Label>
                            <Select name="id_type" required defaultValue="national_id">
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
                            <Input id="id_number" name="id_number" placeholder="Enter ID number" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name (Optional)</Label>
                        <Input id="business_name" name="business_name" placeholder="If you operate as a business" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_registration">Business Registration Number (Optional)</Label>
                        <Input id="business_registration" name="business_registration" placeholder="e.g. CC/2024/00001" />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Document Verification</h3>
                            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium">Required</span>
                        </div>

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
                        <li>Our team will verify your submitted details</li>
                        <li>Verification typically takes 1-2 business days</li>
                        <li>Once approved, you'll be able to list properties</li>
                    </ul>
                </div>

                <Button type="submit" className="w-full bg-black hover:bg-zinc-800" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Submitting...' : 'Submit Verification Request'}
                </Button>
            </form>
        </div>
    )
}
