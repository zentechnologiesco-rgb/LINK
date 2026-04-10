"use client";

import { ChevronRight, Home, Info, Plus, Sparkles, Zap } from "@/components/ui/icons";

import { cn } from "@/lib/utils";

import {
  CardRow,
  CardSection,
  FieldLabel,
  NumberStepperRow,
  UnitCard,
} from "./components";
import { BATCH_GENERATOR_FIELDS } from "./constants";
import { getPropertyTypeLabel } from "./utils";
import type { InventoryGenerator, PropertyUnitForm } from "./types";

export function SingleHomeInventorySection({
  singleHomeUnit,
  propertyType,
  onUpdateUnit,
}: {
  singleHomeUnit: PropertyUnitForm | undefined;
  propertyType: string;
  onUpdateUnit: (patch: Partial<PropertyUnitForm>) => void;
}) {
  return (
    <>
      <CardSection>
        <CardRow>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
              <Home className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-neutral-950">
                Whole-home setup
              </p>
              <p className="mt-1 text-[13px] leading-5 text-neutral-500">
                Single-home listings are treated as one rentable space. Set one
                rent here, then publish the listing from your dashboard once
                it&apos;s approved.
              </p>
            </div>
          </div>
        </CardRow>
        <CardRow last>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <FieldLabel>Monthly Rent</FieldLabel>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[24px] font-bold leading-none text-neutral-400">
                  N$
                </span>
                <input
                  type="number"
                  value={singleHomeUnit?.priceNad ?? ""}
                  onChange={(e) => onUpdateUnit({ priceNad: e.target.value })}
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-[38px] font-bold leading-none text-neutral-950 outline-none placeholder:text-neutral-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="self-end pb-0.5 text-[18px] font-medium text-neutral-400">
                  /mo
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                Listing
              </p>
              <p className="mt-1 text-[14px] font-semibold text-neutral-950">
                {getPropertyTypeLabel(propertyType)}
              </p>
            </div>
          </div>
        </CardRow>
      </CardSection>

      <CardSection>
        <NumberStepperRow
          label="Bedrooms"
          value={singleHomeUnit?.bedrooms ?? ""}
          onChange={(value) => onUpdateUnit({ bedrooms: value })}
          max={10}
        />
        <NumberStepperRow
          label="Bathrooms"
          value={singleHomeUnit?.bathrooms ?? ""}
          onChange={(value) => onUpdateUnit({ bathrooms: value })}
          max={10}
        />
        <NumberStepperRow
          label="Max Occupants"
          sublabel="People allowed to live here"
          value={singleHomeUnit?.maxOccupants ?? ""}
          onChange={(value) => onUpdateUnit({ maxOccupants: value })}
          min={1}
          max={20}
          last
        />
      </CardSection>

      <CardSection>
        <CardRow last className="flex items-center justify-between gap-4">
          <span className="text-[15px] text-neutral-950">Size (m²)</span>
          <input
            type="number"
            value={singleHomeUnit?.sizeSqm ?? ""}
            onChange={(e) => onUpdateUnit({ sizeSqm: e.target.value })}
            placeholder="—"
            className="w-24 bg-transparent text-right text-[15px] font-semibold text-neutral-950 outline-none placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </CardRow>
      </CardSection>

      {Number(singleHomeUnit?.priceNad || 0) <= 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-[13px] text-amber-800">
            Add the rent for this home before submitting the listing.
          </p>
        </div>
      ) : null}
    </>
  );
}

export function MultiUnitInventorySection({
  units,
  summary,
  showBatchGen,
  generator,
  onToggleBatchGen,
  onGeneratorChange,
  onGenerateBatch,
  onAddUnit,
  onEditUnit,
  onDuplicateUnit,
  onRemoveUnit,
}: {
  units: PropertyUnitForm[];
  summary: {
    minPrice: number;
    maxPrice: number;
  };
  showBatchGen: boolean;
  generator: InventoryGenerator;
  onToggleBatchGen: () => void;
  onGeneratorChange: (key: keyof InventoryGenerator, value: string) => void;
  onGenerateBatch: () => void;
  onAddUnit: () => void;
  onEditUnit: (index: number) => void;
  onDuplicateUnit: (index: number) => void;
  onRemoveUnit: (index: number) => void;
}) {
  return (
    <>
      {units.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Units", value: String(units.length) },
            {
              label: "From",
              value:
                summary.minPrice > 0
                  ? `N$${summary.minPrice.toLocaleString()}`
                  : "—",
            },
            {
              label: "Up to",
              value:
                summary.maxPrice > summary.minPrice
                  ? `N$${summary.maxPrice.toLocaleString()}`
                  : summary.minPrice > 0
                    ? `N$${summary.minPrice.toLocaleString()}`
                    : "—",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-[#f5f5f7] p-3.5 text-center"
            >
              <p className="truncate text-[19px] font-bold leading-none tracking-[-0.02em] text-neutral-950">
                {stat.value}
              </p>
              <p className="mt-1 text-[12px] font-medium text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <CardSection>
        <button
          type="button"
          onClick={onToggleBatchGen}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7]">
            <Sparkles className="h-4 w-4 text-neutral-700" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-neutral-950">
              Bulk Add Units
            </p>
            <p className="text-[12px] text-neutral-400">
              Generate identical units in one tap
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-200",
              showBatchGen && "rotate-90",
            )}
            strokeWidth={2}
          />
        </button>

        {showBatchGen ? (
          <div className="animate-in space-y-4 border-t border-neutral-100 p-4 fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              {BATCH_GENERATOR_FIELDS.map((field) => (
                <div key={field.key}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <input
                    type={field.type}
                    value={generator[field.key]}
                    onChange={(e) => onGeneratorChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] font-medium text-neutral-950 outline-none transition-all focus:border-neutral-400 focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onGenerateBatch}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" strokeWidth={2.5} />
              Generate {generator.count || "0"} Units
            </button>
          </div>
        ) : null}
      </CardSection>

      <button
        type="button"
        onClick={onAddUnit}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-neutral-300 bg-white/60 py-4 text-[15px] font-semibold text-neutral-500 transition-all hover:border-neutral-400 hover:bg-white hover:text-neutral-700 active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Add Unit
      </button>

      {units.length > 0 ? (
        <div className="space-y-3">
          {units.map((unit, index) => (
            <UnitCard
              key={`${unit._id ?? "new"}-${index}`}
              unit={unit}
              index={index}
              onEdit={() => onEditUnit(index)}
              onDuplicate={() => onDuplicateUnit(index)}
              onRemove={() => onRemoveUnit(index)}
            />
          ))}
        </div>
      ) : (
        <CardSection className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Home className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-semibold text-neutral-950">
            No units yet
          </p>
          <p className="mt-1 text-[14px] text-neutral-400">
            Tap &ldquo;Add Unit&rdquo; to create your first rentable space.
          </p>
        </CardSection>
      )}

      {units.length > 0 &&
      units.some((unit) => !unit.priceNad || Number(unit.priceNad) <= 0) ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-[13px] text-amber-800">
            Some units are missing a price. Tap to edit.
          </p>
        </div>
      ) : null}
    </>
  );
}
