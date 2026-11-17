"use client";
import { useActionState } from "react";
import { resetPassword } from "@/app/admin-actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

export function ResetPasswordButton({ id }: { id: number }) {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});
  if (state.ok) return <p className="info" style={{ flexBasis: "100%" }}>{state.ok}</p>;
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn alt small">Mot de passe temporaire</SubmitButton>
    </form>
  );
}
