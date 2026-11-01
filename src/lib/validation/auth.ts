import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registrationSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(80, "Display name must be 80 characters or fewer."),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export function getFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((fieldErrors, issue) => {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }

    return fieldErrors;
  }, {});
}
