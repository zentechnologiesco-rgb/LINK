"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

import {
  CardRow,
  CardSection,
  FieldLabel,
  InlineSelectRow,
  NumberStepperRow,
} from "./components";
import { GENDER_POLICY_OPTIONS, ROOM_TYPE_OPTIONS } from "./constants";
import type { ListingType, PropertyUnitForm } from "./types";

export function PropertyUnitEditorSheet({
  listingType,
  unit,
  unitIndex,
  open,
  onOpenChange,
  onUpdateUnit,
}: {
  listingType: ListingType;
  unit: PropertyUnitForm | null;
  unitIndex: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUnit: (patch: Partial<PropertyUnitForm>) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[93vh] flex-col overflow-hidden rounded-t-[28px] border-0 bg-white p-0 focus:outline-none"
      >
        {unit !== null && unitIndex !== null ? (
          <>
            <SheetTitle className="sr-only">
              {unit.title || `Unit ${unitIndex + 1}`} editor
            </SheetTitle>
            <SheetDescription className="sr-only">
              Update the unit details, rent, occupancy settings, and notes.
            </SheetDescription>

            <div className="flex-shrink-0 justify-center pb-1 pt-3">
              <div className="mx-auto h-1 w-9 rounded-full bg-neutral-300" />
            </div>

            <div className="flex flex-shrink-0 items-center justify-between bg-white px-5 py-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-[15px] font-medium text-neutral-500 transition-all hover:text-neutral-700 active:scale-95"
              >
                Cancel
              </button>
              <div className="text-center">
                <p className="text-[16px] font-semibold leading-none text-neutral-950">
                  {unit.title || `Unit ${unitIndex + 1}`}
                </p>
                <p className="mt-0.5 text-[12px] text-neutral-400">Edit unit</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-[15px] font-semibold text-neutral-950 transition-all hover:text-neutral-700 active:scale-95"
              >
                Done
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
              <CardSection>
                <CardRow>
                  <FieldLabel>Unit Name</FieldLabel>
                  <input
                    value={unit.title}
                    onChange={(e) => onUpdateUnit({ title: e.target.value })}
                    placeholder="e.g. Studio A or Room 12"
                    className="mt-0.5 w-full bg-transparent text-[17px] font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-300"
                  />
                </CardRow>
                <CardRow last>
                  <FieldLabel>Unit Code</FieldLabel>
                  <input
                    value={unit.unitCode}
                    onChange={(e) => onUpdateUnit({ unitCode: e.target.value })}
                    placeholder="A-101"
                    className="mt-0.5 w-full bg-transparent font-mono text-[16px] font-medium text-neutral-950 outline-none placeholder:text-neutral-300"
                  />
                </CardRow>
              </CardSection>

              <CardSection>
                <CardRow last>
                  <FieldLabel>Monthly Rent</FieldLabel>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[24px] font-bold leading-none text-neutral-400">
                      N$
                    </span>
                    <input
                      type="number"
                      value={unit.priceNad}
                      onChange={(e) => onUpdateUnit({ priceNad: e.target.value })}
                      placeholder="0"
                      className="min-w-0 flex-1 bg-transparent text-[38px] font-bold leading-none text-neutral-950 outline-none placeholder:text-neutral-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="self-end pb-0.5 text-[18px] font-medium text-neutral-400">
                      /mo
                    </span>
                  </div>
                </CardRow>
              </CardSection>

              <CardSection>
                <NumberStepperRow
                  label="Bedrooms"
                  value={unit.bedrooms}
                  onChange={(value) => onUpdateUnit({ bedrooms: value })}
                  max={10}
                />
                <NumberStepperRow
                  label="Bathrooms"
                  value={unit.bathrooms}
                  onChange={(value) => onUpdateUnit({ bathrooms: value })}
                  max={10}
                />
                <NumberStepperRow
                  label="Max Occupants"
                  sublabel="People allowed to live here"
                  value={unit.maxOccupants}
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
                    value={unit.sizeSqm}
                    onChange={(e) => onUpdateUnit({ sizeSqm: e.target.value })}
                    placeholder="—"
                    className="w-24 bg-transparent text-right text-[15px] font-semibold text-neutral-950 outline-none placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </CardRow>
              </CardSection>

              <CardSection>
                <CardRow className="flex items-center justify-between gap-4">
                  <span className="text-[15px] text-neutral-950">
                    Block / Wing
                  </span>
                  <input
                    value={unit.blockLabel}
                    onChange={(e) => onUpdateUnit({ blockLabel: e.target.value })}
                    placeholder="North Wing"
                    className="w-36 bg-transparent text-right text-[14px] font-medium text-neutral-600 outline-none placeholder:text-neutral-300"
                  />
                </CardRow>
                <CardRow last className="flex items-center justify-between gap-4">
                  <span className="text-[15px] text-neutral-950">Floor</span>
                  <input
                    value={unit.floorLabel}
                    onChange={(e) => onUpdateUnit({ floorLabel: e.target.value })}
                    placeholder="Floor 2"
                    className="w-36 bg-transparent text-right text-[14px] font-medium text-neutral-600 outline-none placeholder:text-neutral-300"
                  />
                </CardRow>
              </CardSection>

              {listingType === "student_accommodation" ? (
                <CardSection>
                  <InlineSelectRow
                    label="Room Type"
                    value={unit.roomType || "private"}
                    onValueChange={(value) => onUpdateUnit({ roomType: value })}
                    options={ROOM_TYPE_OPTIONS}
                  />
                  <InlineSelectRow
                    label="Gender Policy"
                    value={unit.genderPolicy || "mixed"}
                    onValueChange={(value) => onUpdateUnit({ genderPolicy: value })}
                    options={GENDER_POLICY_OPTIONS}
                    last
                  />
                </CardSection>
              ) : null}

              <CardSection>
                <CardRow last>
                  <FieldLabel>Notes / Description</FieldLabel>
                  <textarea
                    value={unit.description}
                    onChange={(e) => onUpdateUnit({ description: e.target.value })}
                    placeholder="Anything unique about this unit — view, special features, recent renovation…"
                    rows={3}
                    className="mt-0.5 w-full resize-none bg-transparent text-[15px] leading-relaxed text-neutral-950 outline-none placeholder:text-neutral-300"
                  />
                </CardRow>
              </CardSection>
            </div>

            <div className="flex-shrink-0 border-t border-neutral-200/50 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-12 w-full rounded-2xl bg-neutral-950 text-[15px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.97]"
              >
                Done
              </button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
