import {
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

export function AuthField({ error, id, label, ...inputProps }: AuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-semibold text-[#28392f]"
        htmlFor={inputId}
      >
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-[#dbe4dc] bg-white px-3.5 text-[15px] text-[#17231b] outline-none transition-colors placeholder:text-[#98a49b] hover:border-[#b9c9bc] focus:border-[#5b9c39] focus:ring-4 focus:ring-[#7fc853]/15 disabled:cursor-not-allowed disabled:bg-[#f3f6f3] disabled:text-[#7d8980]"
        id={inputId}
      />
      {error ? (
        <p className="text-sm leading-5 text-[#a2342d]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
};

export function AuthButton({
  children,
  className = "",
  disabled,
  pending = false,
  pendingLabel = "Please wait…",
  type = "submit",
  variant = "primary",
  ...buttonProps
}: AuthButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "border border-[#1d4d2d] bg-[#1d4d2d] text-white hover:bg-[#173e25] focus-visible:ring-[#3e8c4e]/30"
      : "border border-[#dbe4dc] bg-white text-[#2a4032] hover:bg-[#f5f8f5] focus-visible:ring-[#5b9c39]/20";

  return (
    <button
      {...buttonProps}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${className}`}
      disabled={disabled || pending}
      type={type}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

type AuthMessageProps = {
  children: ReactNode;
  tone: "error" | "info" | "success";
};

export function AuthMessage({ children, tone }: AuthMessageProps) {
  const toneClasses = {
    error: "border-[#f2d4d1] bg-[#fff7f6] text-[#8d2f29]",
    info: "border-[#d9e7d5] bg-[#f5faf2] text-[#365f2d]",
    success: "border-[#cfe6c8] bg-[#f3faef] text-[#2d5a25]",
  };

  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-3.5 py-3 text-sm leading-6 ${toneClasses[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
