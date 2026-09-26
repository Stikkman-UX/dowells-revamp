import type { HeroData } from "@/types/cms";
import HeroCarousel from "./HeroCarousel";

type HeroProps = { data: HeroData };

/**
 * Server entry point for the registry. The heading, CTA buttons and stats
 * are static; only the background `carousel` items rotate. All interactivity
 * (the Figma wipe transition, autoplay driver, pause/dots controls) lives in
 * the client island `HeroCarousel`. Figma: hero instance 313:320 (component
 * 151:640).
 */
export default function Hero({ data }: HeroProps) {
  return <HeroCarousel data={data} />;
}
