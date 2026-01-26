'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Eraser, Check, Type, PenTool, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3
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
        ctx.fillStyle = '#000000'
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
                <Label className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-lg text-black">
                    Your Signature
                </Label>
                {hasSignature && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSignature}
                        disabled={disabled}
                        className="text-black/40 hover:text-black hover:bg-black/5 rounded-full px-3 h-8 text-xs font-bold uppercase tracking-wider"
                    >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Reset
                    </Button>
                )}
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'draw' | 'type')}>
                <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-black/5">
                    <TabsTrigger value="draw" disabled={disabled} className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <PenTool className="h-4 w-4 mr-2" />
                        Draw
                    </TabsTrigger>
                    <TabsTrigger value="type" disabled={disabled} className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Type className="h-4 w-4 mr-2" />
                        Type
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="mt-4 group relative">
                    <Card className="p-0 border-0 rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white shadow-sm">
                        <canvas
                            ref={canvasRef}
                            className={cn(
                                "w-full h-40 bg-white cursor-crosshair touch-none transition-colors",
                                disabled ? "opacity-50 cursor-not-allowed" : "group-hover:bg-gray-50"
                            )}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {!hasSignature && !disabled && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-black/20 font-[family-name:var(--font-anton)] text-xl uppercase tracking-widest select-none">
                                    Sign Here
                                </p>
                            </div>
                        )}
                    </Card>
                    <p className="text-xs text-black/40 mt-2 font-medium text-center">
                        Draw your signature using your mouse or finger
                    </p>
                </TabsContent>

                <TabsContent value="type" className="mt-4 space-y-4">
                    <Input
                        type="text"
                        placeholder="Type your full name"
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        disabled={disabled}
                        className="text-lg rounded-xl border-black/10 focus-visible:ring-black bg-white h-12"
                    />
                    <Card className="p-0 border-0 rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-32 bg-white"
                        />
                    </Card>
                    <p className="text-xs text-black/40 text-center font-medium">
                        Your typed name will be rendered as a signature
                    </p>
                </TabsContent>
            </Tabs>

            {hasSignature && (
                <div className="flex items-center justify-center gap-2 text-black font-bold text-sm bg-black/5 py-2 rounded-full">
                    <Check className="h-4 w-4" />
                    Signature Captured
                </div>
            )}
        </div>
    )
}
