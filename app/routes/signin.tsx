import { createFileRoute } from "@tanstack/react-router";
import { AuthPhoneOtpFlow } from "@/components/auth/AuthPhoneOtpFlow";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
});

function SignInPage() {
  return <AuthPhoneOtpFlow mode="signin" />;
}

export default SignInPage;
