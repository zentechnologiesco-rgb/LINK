"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { STEPS } from "./constants";
import type { PropertyFormDirection } from "./navigation";

const LISTINGS_HREF = "/landlord/properties";

type PropertyFormStepData = {
  label: string;
  title: string;
  subtitle: string;
};

export function PropertyFormHeader({
  mode,
  step,
  totalSteps,
  stepData,
  onNavigate,
}: {
  mode: "create" | "edit";
  step: number;
  totalSteps: number;
  stepData: PropertyFormStepData;
  onNavigate: (step: number) => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <div className="flex h-14 items-center gap-3">
            {step === 0 ? (
              <Link
                href={LISTINGS_HREF}
                aria-label="Back to listings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 active:scale-90"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(step - 1)}
                aria-label="Go to previous section"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 active:scale-90"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-center text-[15px] font-semibold leading-none tracking-[-0.01em] text-neutral-950">
                {mode === "edit" ? "Edit Listing" : stepData.label}
              </p>
              <p className="mt-0.5 text-center text-[12px] leading-none tabular-nums text-neutral-500">
                {mode === "edit" ? stepData.label : `${step + 1} of ${totalSteps}`}
              </p>
            </div>

            {mode === "edit" ? (
              <div className="min-w-[76px] rounded-full border border-neutral-200 bg-[#f5f5f7] px-3 py-1 text-center text-[12px] font-medium tabular-nums text-neutral-600">
                {step + 1} of {totalSteps}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {STEPS.map((section, index) => {
                  const accessible = index <= step;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onNavigate(index)}
                      disabled={!accessible}
                      aria-label={`Go to ${section.label}`}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        index === step
                          ? "h-2 w-5 bg-neutral-950"
                          : index < step
                            ? "h-2 w-2 cursor-pointer bg-neutral-400"
                            : "h-2 w-2 cursor-default bg-neutral-200",
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === "create" ? (
        <div className="h-[2px] bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      ) : null}
    </header>
  );
}

export function PropertyFormStepViewport({
  children,
  mode,
  step,
  renderDirection,
}: {
  children: ReactNode;
  mode: "create" | "edit";
  step: number;
  renderDirection: PropertyFormDirection;
}) {
  return (
    <div
      key={step}
      className={cn(
        "mx-auto animate-in space-y-4 px-4 pb-4 pt-7 fade-in duration-200 sm:px-5",
        mode === "edit" ? "max-w-[860px]" : "max-w-xl",
        renderDirection === "forward"
          ? "slide-in-from-right-4"
          : "slide-in-from-left-4",
      )}
    >
      {children}
    </div>
  );
}

export function PropertyFormStepHero({
  stepData,
}: {
  stepData: PropertyFormStepData;
}) {
  return (
    <div className="pb-1">
      <h1 className="text-[1.9rem] leading-[1.15] font-bold tracking-[-0.03em] text-neutral-950">
        {stepData.title}
      </h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-500">
        {stepData.subtitle}
      </p>
    </div>
  );
}

export function PropertyFormBottomBar({
  step,
  totalSteps,
  isLoading,
  submitButtonLabel,
  loadingButtonLabel,
  onNavigate,
}: {
  step: number;
  totalSteps: number;
  isLoading: boolean;
  submitButtonLabel: string;
  loadingButtonLabel: string;
  onNavigate: (step: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-50">
      <div className="pointer-events-auto border-t border-neutral-200/50 bg-white/90 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-xl gap-3">
          {step === 0 ? (
            <Link href={LISTINGS_HREF} className="flex-1">
              <div className="flex h-12 w-full cursor-pointer select-none items-center justify-center rounded-2xl bg-neutral-100 text-[15px] font-semibold text-neutral-600 transition-all hover:bg-neutral-200 active:scale-[0.97]">
                Cancel
              </div>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(step - 1)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-[15px] font-semibold text-neutral-700 transition-all hover:bg-neutral-200 active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(step + 1)}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-[15px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.97]"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-[15px] font-semibold text-white transition-all hover:bg-neutral-800 disabled:opacity-60 active:scale-[0.97]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
              ) : null}
              {isLoading ? loadingButtonLabel : submitButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

