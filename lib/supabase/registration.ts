import { z } from "zod";

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(80, "Name must be 80 characters or fewer."),
    email: z.email({ error: "Enter a valid email address." }).trim().max(254, "Email address is too long."),
    password: z
      .string()
      .min(8, "Use a password with at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer.")
      .refine((value) => /[A-Za-z]/.test(value), "Include at least one letter in your password.")
      .refine((value) => /\d/.test(value), "Include at least one number in your password."),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match.",
  });

export function getRegistrationErrorMessage(error: {
  code?: string;
  status?: number;
}) {
  if (error.code === "signup_disabled") {
    return "Account registration is currently unavailable. Contact your workspace administrator.";
  }
  if (error.code === "weak_password") {
    return "Choose a stronger password that meets your workspace's password policy.";
  }
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return "We couldn't complete registration. If you already have an account, sign in; otherwise review your details and try again.";
  }
  if (
    error.status === 429 ||
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit"
  ) {
    return "Too many attempts. Wait a little while before trying again.";
  }
  return "Registration could not be completed. Check your details or try again later.";
}
