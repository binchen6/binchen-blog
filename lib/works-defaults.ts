import { BookOpen, Compass, Gamepad2, Globe2, Hammer, MousePointerClick, Rocket, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export * from "./works-data";

export const WORK_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  compass: Compass,
  globe: Globe2,
  gamepad: Gamepad2,
  mouse: MousePointerClick,
  hammer: Hammer,
  rocket: Rocket,
  book: BookOpen,
};

export const WORK_ACCENTS: Record<string, string> = {
  dai: "text-dai border-dai/30 bg-dai/5",
  gold: "text-gold border-gold/30 bg-gold/5",
  cinnabar: "text-cinnabar border-cinnabar/30 bg-cinnabar/5",
  ink: "text-ink-3 border-ink-5 bg-ink-5/10",
};
