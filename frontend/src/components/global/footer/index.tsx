import type { FooterData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";
import NewsletterForm from "./NewsletterForm";

type FooterProps = { data: FooterData };

/** Literal classes so Tailwind's scanner can find them (see report). */
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/** Matches Figma node 313:735. */
export default function Footer({ data }: FooterProps) {
  const {
    newsletter,
    logo,
    description,
    phone,
    email,
    socials,
    columns,
    copyright,
    legalLinks,
  } = data;

  const lgColsClass =
    LG_COLS[Math.min(Math.max(columns.length, 1), 6)] ?? "lg:grid-cols-4";

  return (
    <footer className="w-full bg-[#0e1116] text-white">
      <div className="w-full border-b border-white/10 bg-[#1d1d1d]">
        <Container className="flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
          <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-white">
            {newsletter.heading}
          </h2>
          <NewsletterForm placeholder={newsletter.placeholder} button={newsletter.button} />
        </Container>
      </div>

      <Container className="py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 lg:max-w-xs lg:shrink-0">
            <div className="relative block h-14 w-20">
              <CmsMedia media={logo} objectFit="contain" alt={logo?.alt || "Dowell's"} />
            </div>

            <p className="max-w-xs text-sm leading-relaxed text-white/60">{description}</p>

            <div className="flex flex-col gap-1.5 text-sm text-white/70">
              {phone && (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="w-fit hover:text-white">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="w-fit hover:text-white">
                  {email}
                </a>
              )}
            </div>

            {socials.length > 0 && (
              <ul className="flex items-center gap-2.5">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    >
                      <CmsIcon media={social.icon} size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:flex-1 ${lgColsClass}`}
            >
              {columns.map((column) => (
                <div key={column.title} className="flex flex-col gap-4">
                  <h3 className="text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-white/90">
                    {column.title}
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-sm text-white/55 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-4 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          {legalLinks.length > 0 && (
            <ul className="flex flex-wrap items-center gap-5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
    </footer>
  );
}
