import { Suspense } from "react";
import { SignupForm } from "@/components/signup-form";

type SignupPageProps = {
  searchParams: Promise<{ verification?: string | string[] }>;
};

export default function SignupPage(props: SignupPageProps) {
  return (
    <Suspense fallback={<SignupForm />}>
      <SignupPageContent {...props} />
    </Suspense>
  );
}

async function SignupPageContent({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const verificationFailed = params.verification === "failed";
  return <SignupForm verificationFailed={verificationFailed} />;
}
