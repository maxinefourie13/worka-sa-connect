import {
  Wrench,
  Sparkles,
  Leaf,
  Car,
  HardHat,
  PartyPopper,
  Briefcase,
  HeartPulse,
  Truck,
  PawPrint,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * Lucide icon for each top-level CATEGORY_GROUPS slug.
 * Keep this map in sync with CATEGORY_GROUPS in mockData.ts.
 */
export const CATEGORY_GROUP_ICONS: Record<string, LucideIcon> = {
  "home-maintenance": Wrench,
  "cleaning-domestic": Sparkles,
  "garden-outdoor": Leaf,
  "automotive": Car,
  "construction-renovation": HardHat,
  "events-occasions": PartyPopper,
  "business-digital": Briefcase,
  "personal-lifestyle": HeartPulse,
  "moving-logistics": Truck,
  "pet-services": PawPrint,
  "specialist-ondemand": ShieldAlert,
};

export const getCategoryGroupIcon = (slug: string): LucideIcon =>
  CATEGORY_GROUP_ICONS[slug] ?? Briefcase;
