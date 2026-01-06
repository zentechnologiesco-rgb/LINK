'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Eraser, Check, Type, PenTool } from 'lucide-react'

interface SignatureCanvasProps {
    onSignatureChange: (signatureData: string | null) => void
    initialSignature?: string | null
    disabled?: boolean
}

export function SignatureCanvas({ onSignatureChange, initialSignature, disabled }: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)
    const [typedName, setTypedName] = useState('')
    const [mode, setMode] = useState<'draw' | 'type'>('draw')

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * 2
        canvas.height = rect.height * 2
        ctx.scale(2, 2)

        // Set drawing styles
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Load initial signature if provided
        if (initialSignature) {
            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height)
                setHasSignature(true)
            }
            img.src = initialSignature
        }
    }, [initialSignature])

    const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            }
        }
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }, [])

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return
        
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoordinates(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }, [disabled, getCoordinates])

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoordinates(e)
        ctx.lineTo(x, y)
        ctx.stroke()
        setHasSignature(true)
    }, [isDrawing, disabled, getCoordinates])

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return
        
        setIsDrawing(false)
        
        // Save signature data
        const canvas = canvasRef.current
        if (canvas && hasSignature) {
            const signatureData = canvas.toDataURL('image/png')
            onSignatureChange(signatureData)
        }
    }, [isDrawing, hasSignature, onSignatureChange])

    const clearSignature = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
        setHasSignature(false)
        setTypedName('')
        onSignatureChange(null)
    }, [onSignatureChange])

    // Generate signature from typed name
    const generateTypedSignature = useCallback(() => {
        if (!typedName.trim()) {
            onSignatureChange(null)
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)

        // Draw typed signature with cursive-style font
        ctx.font = 'italic 32px "Brush Script MT", cursive, Georgia, serif'
        ctx.fillStyle = '#1a1a2e'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(typedName, rect.width / 2, rect.height / 2)

        setHasSignature(true)
        const signatureData = canvas.toDataURL('image/png')
        onSignatureChange(signatureData)
    }, [typedName, onSignatureChange])

    useEffect(() => {
        if (mode === 'type') {
            generateTypedSignature()
        }
    }, [typedName, mode, generateTypedSignature])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Your Signature</Label>
                {hasSignature && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSignature}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-600"
                    >
                        <Eraser className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'draw' | 'type')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="draw" disabled={disabled}>
                        <PenTool className="h-4 w-4 mr-2" />
                        Draw
                    </TabsTrigger>
                    <TabsTrigger value="type" disabled={disabled}>
                        <Type className="h-4 w-4 mr-2" />
                        Type
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="mt-4">
                    <Card className="p-1">
                        <canvas
                            ref={canvasRef}
                            className={`w-full h-32 border-2 border-dashed rounded-lg bg-white cursor-crosshair touch-none ${
                                disabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </Card>
                    <p className="text-xs text-muted-foreground mt-2">
                        Draw your signature using your mouse or finger (on touch devices)
                    </p>
                </TabsContent>

                <TabsContent value="type" className="mt-4 space-y-4">
                    <Input
                        type="text"
                        placeholder="Type your full name"
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        disabled={disabled}
                        className="text-lg"
                    />
                    <Card className="p-1">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-32 border-2 border-dashed rounded-lg bg-white"
                        />
                    </Card>
                    <p className="text-xs text-muted-foreground">
                        Your typed name will be rendered as a signature
                    </p>
                </TabsContent>
            </Tabs>

            {hasSignature && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="h-4 w-4" />
                    Signature captured
                </div>
            )}
        </div>
    )
}
