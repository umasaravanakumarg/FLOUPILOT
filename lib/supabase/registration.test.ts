import { describe, expect, it } from "vitest";
import {
  getRegistrationErrorMessage,
  registrationSchema,
} from "./registration";

const validRegistration = {
  name: "  Alex Rivera ",
  email: "alex@example.com",
  password: "securepass1",
  passwordConfirmation: "securepass1",
};

describe("account registration validation", () => {
  it("normalizes the name and accepts valid registration details", () => {
    expect(registrationSchema.parse(validRegistration)).toMatchObject({
      name: "Alex Rivera",
      email: "alex@example.com",
    });
  });

  it("rejects invalid email, weak passwords, and mismatched confirmation", () => {
    expect(registrationSchema.safeParse({
      ...validRegistration,
      email: "not-an-email",
    }).success).toBe(false);
    expect(registrationSchema.safeParse({
      ...validRegistration,
      password: "short1",
      passwordConfirmation: "short1",
    }).success).toBe(false);
    expect(registrationSchema.safeParse({
      ...validRegistration,
      passwordConfirmation: "different1",
    }).success).toBe(false);
  });
});

describe("account registration errors", () => {
  it("provides safe, actionable responses without returning provider error text", () => {
    expect(getRegistrationErrorMessage({ code: "signup_disabled" })).toContain("workspace administrator");
    expect(getRegistrationErrorMessage({ code: "weak_password" })).toContain("stronger password");
    expect(getRegistrationErrorMessage({ code: "user_already_exists" })).toContain("If you already have an account");
    expect(getRegistrationErrorMessage({ status: 429 })).toContain("Too many attempts");
    expect(getRegistrationErrorMessage({ code: "unrecognized", status: 500 })).toBe(
      "Registration could not be completed. Check your details or try again later.",
    );
  });
});
