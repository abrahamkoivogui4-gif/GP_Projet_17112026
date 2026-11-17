"use client";
import { useActionState, useState } from "react";
import { submitVerification } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

export function VerificationForm() {
  const [state, action] = useActionState<FormState, FormData>(submitVerification, {});
  const [file, setFile] = useState("");
  if (state.ok) return <p className="info">{state.ok}</p>;
  return (
    <form action={action} className="field" style={{ gap: 12 }}>
      <label htmlFor="document" className="btn alt" style={{ margin: 0 }}>
        {file ? `Photo choisie : ${file}` : "Choisir une photo ou un PDF"}
      </label>
      <input
        id="document"
        name="document"
        type="file"
        className="vh"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")}
      />
      {state.error && <p className="err">{state.error}</p>}
      <SubmitButton disabled={!file} pendingText="Envoi…">
        Envoyer pour vérification
      </SubmitButton>
    </form>
  );
}
