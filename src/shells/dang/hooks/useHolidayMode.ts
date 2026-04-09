import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export interface HolidayConfig {
  enabled: boolean;
  holiday: string;
  greeting: string;
}

export interface HolidayTheme {
  name: string;
  key: string;
  emoji: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  bannerBg: string;
  dotColor: string;
  ctaBg: string;
  ctaText: string;
  ribbonText: string;
}

export const HOLIDAYS: HolidayTheme[] = [
  { name: "Happy New Year", key: "new-year", emoji: "🎆", borderColor: "#FFD700", bgColor: "#1a1a2e", textColor: "#FFD700", bannerBg: "#1a1a2e", dotColor: "rgba(255,215,0,0.15)", ctaBg: "#FFD700", ctaText: "#1a1a2e", ribbonText: "#1a1a2e" },
  { name: "Valentine's Day", key: "valentines", emoji: "💕", borderColor: "#c2185b", bgColor: "#fce4ec", textColor: "#fff", bannerBg: "#c2185b", dotColor: "rgba(255,255,255,0.12)", ctaBg: "#fff", ctaText: "#c2185b", ribbonText: "#fff" },
  { name: "St. Patrick's Day", key: "st-patricks", emoji: "🍀", borderColor: "#2e7d32", bgColor: "#e8f5e9", textColor: "#fff", bannerBg: "#2e7d32", dotColor: "rgba(255,255,255,0.1)", ctaBg: "#fff", ctaText: "#2e7d32", ribbonText: "#fff" },
  { name: "Easter", key: "easter", emoji: "🐣", borderColor: "#7b1fa2", bgColor: "#f3e5f5", textColor: "#fff", bannerBg: "#7b1fa2", dotColor: "rgba(255,255,255,0.12)", ctaBg: "#fff", ctaText: "#7b1fa2", ribbonText: "#fff" },
  { name: "Memorial Day", key: "memorial-day", emoji: "🇺🇸", borderColor: "#1565c0", bgColor: "#e3f2fd", textColor: "#fff", bannerBg: "#1565c0", dotColor: "rgba(255,255,255,0.1)", ctaBg: "#c62828", ctaText: "#fff", ribbonText: "#fff" },
  { name: "4th of July", key: "4th-july", emoji: "🎇", borderColor: "#d32f2f", bgColor: "#fff3e0", textColor: "#fff", bannerBg: "#1565c0", dotColor: "rgba(255,255,255,0.1)", ctaBg: "#d32f2f", ctaText: "#fff", ribbonText: "#fff" },
  { name: "Labor Day", key: "labor-day", emoji: "⚒️", borderColor: "#e65100", bgColor: "#fff8e1", textColor: "#fff", bannerBg: "#e65100", dotColor: "rgba(255,255,255,0.12)", ctaBg: "#fff", ctaText: "#e65100", ribbonText: "#fff" },
  { name: "Halloween", key: "halloween", emoji: "🎃", borderColor: "#ff6f00", bgColor: "#1a1a1a", textColor: "#ff6f00", bannerBg: "#1a1a1a", dotColor: "rgba(255,111,0,0.18)", ctaBg: "#ff6f00", ctaText: "#1a1a1a", ribbonText: "#1a1a1a" },
  { name: "Thanksgiving", key: "thanksgiving", emoji: "🦃", borderColor: "#8d6e63", bgColor: "#efebe9", textColor: "#fff", bannerBg: "#5d4037", dotColor: "rgba(255,255,255,0.1)", ctaBg: "#d84315", ctaText: "#fff", ribbonText: "#fff" },
  { name: "Christmas", key: "christmas", emoji: "🎄", borderColor: "#c62828", bgColor: "#e8f5e9", textColor: "#fff", bannerBg: "#1b4d2e", dotColor: "rgba(255,255,255,0.1)", ctaBg: "#c62828", ctaText: "#fff", ribbonText: "#fff" },
];

export function useHolidayMode() {
  const [config, setConfig] = useState<HolidayConfig>({ enabled: false, holiday: "", greeting: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "holiday_mode")
        .single();
      if (data) {
        const val = data.value as Record<string, unknown>;
        setConfig({
          enabled: !!val.enabled,
          holiday: (val.holiday as string) || "",
          greeting: (val.greeting as string) || "",
        });
      }
    };
    fetch();
  }, []);

  const activeTheme = config.enabled
    ? HOLIDAYS.find((h) => h.key === config.holiday) || null
    : null;

  return { ...config, activeTheme };
}
