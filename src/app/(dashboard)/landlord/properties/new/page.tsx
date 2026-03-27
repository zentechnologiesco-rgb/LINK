"use client";

import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

function CreatePropertyContent() {
  const { user: currentUser, isLoading } = useUser();

  if (isLoading) {
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

  return <PropertyForm mode="create" pageBackgroundClassName="bg-white" />;
}

export default function CreatePropertyPage() {
  return <CreatePropertyContent />;
}
