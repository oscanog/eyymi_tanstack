import { Button } from "@/components/ui/Button";

export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" className="w-full justify-center">
        Continue with Facebook
      </Button>
      <Button type="button" variant="secondary" className="w-full justify-center">
        Continue with Gmail
      </Button>
    </div>
  );
}
