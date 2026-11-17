"use client";
import { useFormStatus } from "react-dom";

/**
 * Bouton d'envoi qui se désactive pendant l'envoi.
 * Avec `name`/`value`, la valeur est recopiée dans un champ caché au clic :
 * c'est plus fiable que le « submitter » du navigateur quand le bouton se désactive aussitôt.
 */
export function SubmitButton({
  children,
  className = "btn",
  pendingText = "Un instant…",
  disabled,
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      onClick={(e) => {
        const form = e.currentTarget.form;
        if (!name || !form) return;
        let input = form.querySelector<HTMLInputElement>(`input[type=hidden][data-submitter="${name}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.dataset.submitter = name;
          form.appendChild(input);
        }
        input.value = value ?? "";
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
