export interface SignupOnboardingSlide {
  id: "location" | "invite";
  title: string;
  description: string;
  bullets: string[];
  icon: "routePulse" | "trustLink";
}

export type GenderOption = "male" | "female" | "gay" | "lesbian";

export interface OnboardingGenderOption {
  value: GenderOption;
  title: string;
  icon: "male" | "female" | "gay" | "lesbian";
}

export const signupOnboardingSlides: SignupOnboardingSlide[] = [
  {
    id: "location",
    title: "Share your live location safely",
    description:
      "Create a private session and share your location in real time with people you trust.",
    bullets: [
      "Private session code based sharing",
      "Live map updates with route context",
      "Meeting place tools for easier coordination",
    ],
    icon: "routePulse",
  },
  {
    id: "invite",
    title: "Invite, connect, and coordinate",
    description:
      "See online users, send invites, and move into a shared map experience in a few taps.",
    bullets: [
      "Online presence and invite flow",
      "Quick join and session management",
      "Designed for mobile-first use",
    ],
    icon: "trustLink",
  },
];

export const onboardingGenderOptions: OnboardingGenderOption[] = [
  {
    value: "male",
    title: "Male",
    icon: "male",
  },
  {
    value: "female",
    title: "Female",
    icon: "female",
  },
  {
    value: "gay",
    title: "Gay",
    icon: "gay",
  },
  {
    value: "lesbian",
    title: "Lesbian",
    icon: "lesbian",
  },
];
