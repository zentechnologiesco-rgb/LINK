"use client";

import { redirect, notFound } from "next/navigation";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface Props {
  params: Promise<{ id: string }>;
}

function EditPropertyContent({ id }: { id: string }) {
  const { user: currentUser, isLoading } = useUser();
  const property = useQuery(api.properties.getById, {
    propertyId: id as Id<"properties">,
  });

  if (isLoading || property === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!currentUser) {
    redirect("/sign-in");
    return null;
  }

  if (currentUser.role !== "landlord" && currentUser.role !== "admin") {
    redirect("/");
    return null;
  }

  if (!property) {
    notFound();
  }

  if (property.landlordId !== currentUser._id && currentUser.role !== "admin") {
    redirect("/");
    return null;
  }

  return (
    <PropertyForm
      mode="edit"
      propertyId={property._id}
      initialData={{
        title: property.title,
        description: property.description || "",
        listingType: property.listingType,
        propertyType: property.propertyType,
        occupancyMode: property.occupancyMode,
        furnishingStatus: property.furnishingStatus,
        genderPolicy: property.genderPolicy,
        priceNad: property.priceNad,
        address: property.address,
        city: property.city,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        sizeSqm: property.sizeSqm || 0,
        maxOccupants: property.maxOccupants || 0,
        amenityNames: property.amenityNames || [],
        utilitiesIncluded: property.utilitiesIncluded || [],
        petPolicy: property.petPolicy || "negotiable",
        images: property.images || [],
        coordinates: property.coordinates,
        approvalStatus: property.approvalStatus,
        publicationStatus: property.publicationStatus,
        adminNotes: property.adminNotes,
        units: property.units,
      }}
    />
  );
}

export default function EditPropertyPage({ params }: Props) {
  const { id } = use(params);
  return <EditPropertyContent id={id} />;
}
