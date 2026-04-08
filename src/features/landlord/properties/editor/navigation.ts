import { EDIT_STEP_LINKS, STEPS } from "./constants";

export type PropertyFormDirection = "forward" | "back";

export function buildEditStepHref(
  nextStep: number,
  pathname: string,
  searchParamString: string,
  options?: { focusClip?: boolean },
) {
  const link = EDIT_STEP_LINKS[nextStep];
  if (!link) return pathname;

  const params = new URLSearchParams(searchParamString);
  params.set("step", link.id);

  if (link.id === "photos" && options?.focusClip) {
    params.set("focus", "clip");
  } else {
    params.delete("focus");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildEditStepLinks(
  pathname: string,
  searchParamString: string,
  prefersClipFocus: boolean,
) {
  return EDIT_STEP_LINKS.map((link, index) => ({
    ...link,
    index,
    href: buildEditStepHref(index, pathname, searchParamString, {
      focusClip: index === 1 && prefersClipFocus,
    }),
  }));
}

export function getRenderDirection(options: {
  mode: "create" | "edit";
  direction: PropertyFormDirection;
  routedStep: number;
  previousRoutedStep: number;
}) {
  const { mode, direction, routedStep, previousRoutedStep } = options;

  if (mode !== "edit") return direction;
  if (routedStep > previousRoutedStep) return "forward";
  if (routedStep < previousRoutedStep) return "back";
  return direction;
}

export function getStepData(step: number, isSingleHome: boolean) {
  if (step === 5 && isSingleHome) {
    return {
      ...STEPS[step],
      label: "Pricing",
      title: "Set rent",
      subtitle:
        "Single-home listings use one whole-home price instead of separate unit pricing.",
    };
  }

  return STEPS[step];
}

export function getSubmitButtonLabels(
  mode: "create" | "edit",
  approvalStatus?: string,
) {
  return {
    submitButtonLabel:
      mode === "create"
        ? "Submit for Review"
        : approvalStatus === "rejected"
          ? "Save & Resubmit"
          : approvalStatus === "pending"
            ? "Update for Review"
            : "Save Changes",
    loadingButtonLabel:
      mode === "create"
        ? "Submitting…"
        : approvalStatus === "rejected"
          ? "Resubmitting…"
          : "Saving…",
  };
}

