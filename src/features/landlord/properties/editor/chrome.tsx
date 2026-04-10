"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, X } from "@/components/ui/icons";

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
  const isEdit = mode === "edit";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className={cn(
          "border-b backdrop-blur-xl border-neutral-100/60 bg-white/80 backdrop-blur-2xl"
        )}
      >
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <div className="flex h-14 items-center gap-3">
            {step === 0 ? (
              <Link
                href={LISTINGS_HREF}
                aria-label="Back to listings"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors active:scale-90",
                  "border-neutral-200/60 bg-white text-neutral-950 hover:bg-neutral-50"
                )}
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(step - 1)}
                aria-label="Go to previous section"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors active:scale-90",
                  "border-neutral-200/60 bg-white text-neutral-950 hover:bg-neutral-50"
                )}
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}

            <div className="min-w-0 flex-1"></div>

              <div
                className={cn(
                  "min-w-[76px] rounded-full border px-3 py-1 text-center text-[12px] font-medium tabular-nums",
                  "border-neutral-200/60 bg-neutral-50 text-neutral-600"
                )}
              >
                {step + 1} of {totalSteps}
              </div>
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
        "mx-auto animate-in space-y-4 px-4 pb-4 pt-7 fade-in duration-200 sm:px-5 max-w-[860px]",
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
  mode = "create",
  stepData,
}: {
  mode?: "create" | "edit";
  stepData: PropertyFormStepData;
}) {
  const isEdit = mode === "edit";

  return (
    <div className="pb-1">
      <h1
        className={cn(
          "text-[1.9rem] leading-[1.15] font-bold tracking-[-0.03em] text-neutral-950"
        )}
      >
        {stepData.title}
      </h1>
      <p
        className={cn(
          "mt-1.5 text-[15px] leading-relaxed text-neutral-500"
        )}
      >
        {stepData.subtitle}
      </p>
    </div>
  );
}

export function PropertyFormBottomBar({
  mode = "create",
  step,
  totalSteps,
  isLoading,
  submitButtonLabel,
  loadingButtonLabel,
  onNavigate,
}: {
  mode?: "create" | "edit";
  step: number;
  totalSteps: number;
  isLoading: boolean;
  submitButtonLabel: string;
  loadingButtonLabel: string;
  onNavigate: (step: number) => void;
}) {
  const isEdit = mode === "edit";

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-50">
      <div
        className={cn(
          "pointer-events-auto border-t px-4 py-3 backdrop-blur-2xl border-neutral-100/60 bg-white/80"
        )}
      >
        <div
          className={cn(
            "mx-auto flex gap-3 max-w-[860px]"
          )}
        >
          {step === 0 ? (
            <Link href={LISTINGS_HREF} className="flex-1">
              <div
                className={cn(
                  "flex h-12 w-full cursor-pointer select-none items-center justify-center rounded-2xl border text-[15px] font-semibold transition-all active:scale-[0.97]",
                  "border-neutral-200/80 bg-white text-neutral-950 hover:bg-neutral-50"
                )}
              >
                Cancel
              </div>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(step - 1)}
              className={cn(
                "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-[15px] font-semibold transition-all active:scale-[0.97]",
                "border-neutral-200/80 bg-white text-neutral-950 hover:bg-neutral-50"
              )}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(step + 1)}
              className={cn(
                "flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97]",
                "bg-neutral-950 text-white hover:bg-neutral-800"
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-all disabled:opacity-60 active:scale-[0.97]",
                "bg-neutral-950 text-white hover:bg-neutral-800"
              )}
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
