'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, PenTool, RotateCcw, Type } from 'lucide-react'
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
    }, [initialSignature, mode])

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
    const generateTypedSignature = useCallback((name: string) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)

        if (!name.trim()) {
            setHasSignature(false)
            onSignatureChange(null)
            return
        }

        // Draw typed signature with cursive-style font
        ctx.font = 'italic 32px "Brush Script MT", cursive, Georgia, serif'
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(name, rect.width / 2, rect.height / 2)

        setHasSignature(true)
        const signatureData = canvas.toDataURL('image/png')
        onSignatureChange(signatureData)
    }, [onSignatureChange])

    const handleModeChange = useCallback((nextMode: 'draw' | 'type') => {
        setMode(nextMode)

        requestAnimationFrame(() => {
            const canvas = canvasRef.current
            const ctx = canvas?.getContext('2d')
            if (!ctx || !canvas) return

            const rect = canvas.getBoundingClientRect()
            ctx.clearRect(0, 0, rect.width, rect.height)

            if (nextMode === 'type') {
                generateTypedSignature(typedName)
                return
            }

            setHasSignature(false)
            onSignatureChange(null)
        })
    }, [generateTypedSignature, onSignatureChange, typedName])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-neutral-950">Your signature</p>
                    <p className="mt-1 text-xs text-neutral-500">Draw or type the signature that will appear on the lease.</p>
                </div>
                {hasSignature && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSignature}
                        disabled={disabled}
                        className="h-9 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-500 shadow-none hover:bg-neutral-50 hover:text-neutral-900"
                    >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Reset
                    </Button>
                )}
            </div>

            <Tabs value={mode} onValueChange={(v) => handleModeChange(v as 'draw' | 'type')}>
                <TabsList className="grid w-full grid-cols-2 rounded-full border border-neutral-200 bg-neutral-50 p-1">
                    <TabsTrigger value="draw" disabled={disabled} className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-none">
                        <PenTool className="h-4 w-4 mr-2" />
                        Draw
                    </TabsTrigger>
                    <TabsTrigger value="type" disabled={disabled} className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-none">
                        <Type className="h-4 w-4 mr-2" />
                        Type
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="mt-4 group relative">
                    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                        <canvas
                            ref={canvasRef}
                            className={cn(
                                'h-44 w-full touch-none bg-white transition-colors',
                                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair group-hover:bg-neutral-50/60'
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
                                <p className="select-none text-sm font-medium tracking-[0.18em] text-neutral-300 uppercase">
                                    Sign Here
                                </p>
                            </div>
                        )}
                    </div>
                    <p className="mt-2 text-center text-xs font-medium text-neutral-400">
                        Draw your signature using your mouse or finger
                    </p>
                </TabsContent>

                <TabsContent value="type" className="mt-4 space-y-4">
                    <Input
                        type="text"
                        placeholder="Type your full name"
                        value={typedName}
                        onChange={(e) => {
                            const nextValue = e.target.value
                            setTypedName(nextValue)
                            if (mode === 'type') {
                                generateTypedSignature(nextValue)
                            }
                        }}
                        disabled={disabled}
                        className="h-12 rounded-[18px] border-neutral-200 bg-neutral-50 text-base shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10"
                    />
                    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                        <canvas
                            ref={canvasRef}
                            className="h-36 w-full bg-white"
                        />
                    </div>
                    <p className="text-center text-xs font-medium text-neutral-400">
                        Your typed name will be rendered as a signature
                    </p>
                </TabsContent>
            </Tabs>

            {hasSignature && (
                <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700">
                    <Check className="h-4 w-4" />
                    Signature Captured
                </div>
            )}
        </div>
    )
}
