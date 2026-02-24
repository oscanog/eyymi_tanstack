import { createFileRoute } from "@tanstack/react-router";
import { AuthPhoneOtpFlow } from "@/components/auth/AuthPhoneOtpFlow";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  return <AuthPhoneOtpFlow mode="signup" />;
}

export default SignUpPage;
