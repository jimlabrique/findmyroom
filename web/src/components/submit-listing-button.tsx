"use client";

import { useFormStatus } from "react-dom";

type SubmitListingButtonProps = {
  label: string;
  pendingLabel: string;
  className?: string;
};

export function SubmitListingButton({
  label,
  pendingLabel,
  className = "btn btn-primary",
}: SubmitListingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
