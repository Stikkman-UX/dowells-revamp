import styles from "./marquee.module.css";

type MarqueeProps = {
  clients: { name: string }[];
  labelledBy?: string;
};

const ITEM_CLASS =
  "flex h-20 shrink-0 items-center justify-center whitespace-nowrap border-r border-ink/[0.06] bg-white px-10 text-[1.05rem] font-semibold text-grey-400";

/**
 * Seamless, pure-CSS infinite marquee of client names — no client JS.
 * Pauses on hover/focus and degrades to a static wrapped list under
 * `prefers-reduced-motion` (see marquee.module.css). The second copy of
 * the list is `aria-hidden` and exists only to make the loop seamless.
 */
export function Marquee({ clients, labelledBy }: MarqueeProps) {
  if (clients.length === 0) return null;

  return (
    <div
      className={`${styles.wrapper} rounded-2xl bg-ink/[0.06]`}
      role="region"
      aria-labelledby={labelledBy}
    >
      <ul className={styles.track}>
        {clients.map((client, index) => (
          <li key={`client-${index}-${client.name}`} className={ITEM_CLASS}>
            {client.name}
          </li>
        ))}
        {clients.map((client, index) => (
          <li
            key={`client-dup-${index}-${client.name}`}
            aria-hidden="true"
            className={`${ITEM_CLASS} ${styles.duplicate}`}
          >
            {client.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
