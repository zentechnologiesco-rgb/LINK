'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface VerificationFormProps {
    submitAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export function VerificationForm({ submitAction }: VerificationFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await submitAction(formData)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success('Verification request submitted!')
            // Page will revalidate and show status
        }
        setIsLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Form Fields */}
            <form action={handleSubmit} className="space-y-6">
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
