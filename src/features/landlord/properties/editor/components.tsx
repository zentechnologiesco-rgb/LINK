"use client";

import type { ReactNode } from "react";
import {
  Bath,
  Bed,
  Check,
  ChevronRight,
  CopyPlus,
  Minus,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { PropertyUnitForm } from "./types";

export function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-medium transition-all duration-150 active:scale-95 select-none",
        selected
          ? "bg-neutral-950 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
      )}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
      ) : null}
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block select-none text-[11px] font-bold uppercase tracking-widest text-neutral-400">
      {children}
    </span>
  );
}

export function CardSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardRow({
  children,
  last = false,
  className,
}: {
  children: ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3.5",
        !last && "border-b border-neutral-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InlineSelectRow({
  label,
  value,
  onValueChange,
  options,
  last = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  last?: boolean;
}) {
  return (
    <CardRow last={last} className="flex items-center justify-between gap-4">
      <span className="flex-shrink-0 text-[15px] text-neutral-950">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 w-auto min-w-[120px] max-w-[180px] truncate rounded-lg border-neutral-200 bg-neutral-50 px-3 text-[14px] font-medium text-neutral-950 shadow-none focus:border-neutral-300 focus:bg-white focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardRow>
  );
}

export function NumberStepperRow({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 20,
  last = false,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  last?: boolean;
}) {
  const num = parseInt(value) || 0;

  return (
    <CardRow last={last} className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[15px] text-neutral-950">{label}</p>
        {sublabel ? (
          <p className="mt-0.5 text-[12px] text-neutral-500">{sublabel}</p>
        ) : null}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(min, num - 1)))}
          disabled={num <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-all hover:bg-neutral-200 disabled:opacity-30 active:scale-90 border border-neutral-200"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="w-7 select-none text-center text-[16px] font-semibold tabular-nums text-neutral-950">
          {num || "–"}
        </span>
        <button
          type="button"
          onClick={() => onChange(String(Math.min(max, num + 1)))}
          disabled={num >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-all hover:bg-neutral-200 disabled:opacity-30 active:scale-90 border border-neutral-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </CardRow>
  );
}

export function UnitCard({
  unit,
  index,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  unit: PropertyUnitForm;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const price = Number(unit.priceNad) || 0;
  const beds = parseInt(unit.bedrooms) || 0;
  const baths = parseInt(unit.bathrooms) || 0;
  const size = parseFloat(unit.sizeSqm) || 0;

  return (
    <div className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white">
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200/50">
          <span className="text-[14px] font-bold tabular-nums text-neutral-500">
            {index + 1}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-neutral-950">
              {unit.title || `Unit ${index + 1}`}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {price > 0 ? (
              <span className="text-[14px] font-semibold text-neutral-950">
                N${price.toLocaleString()}
                <span className="font-normal text-neutral-500">/mo</span>
              </span>
            ) : null}
            {beds > 0 ? (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Bed className="h-3.5 w-3.5" strokeWidth={1.8} />
                {beds}
              </span>
            ) : null}
            {baths > 0 ? (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Bath className="h-3.5 w-3.5" strokeWidth={1.8} />
                {baths}
              </span>
            ) : null}
            {size > 0 ? (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.8} />
                {size}m²
              </span>
            ) : null}
            {!price && !beds && !baths && !size ? (
              <span className="text-[13px] italic text-neutral-400">
                Tap to add details
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight
          className="h-4 w-4 flex-shrink-0 text-neutral-300"
          strokeWidth={2}
        />
      </button>

      <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-950 active:bg-neutral-100"
        >
          <CopyPlus className="h-3.5 w-3.5" strokeWidth={2} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600 active:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Remove
        </button>
      </div>
    </div>
  );
}
