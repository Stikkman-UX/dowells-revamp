"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldProps } from "../types";
import { Button } from "@/components/admin/ui/Button";
import { setIn, hasErrorUnder } from "../path";
import { RepeaterRow } from "./RepeaterRow";

let uidCounter = 0;
function makeUid() {
  uidCounter += 1;
  return `row-${uidCounter}`;
}

/**
 * List editor with Add / Remove / Move up / Move down (no drag-and-drop).
 * React keys come from a PARALLEL client-only `uids` array kept in local
 * component state — it is only ever read to build `key`/focus-ref maps and
 * is never written back into `data`.
 */
export function RepeaterField({ field, value, onChange, path, errors }: FieldProps) {
  const items = Array.isArray(value) ? value : [];
  const [uids, setUidsState] = useState<string[]>(() => items.map(() => makeUid()));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusUid, setFocusUid] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Full-subtree replacements (Reset / Reload / Save success) can change the
  // array wholesale without going through our own add/remove/move handlers —
  // resync length so keys never run stale or short.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncing a local uid list to an externally-replaced array (Reset/Reload/Save), not derivable at render time
    setUidsState((prev) => (prev.length === items.length ? prev : items.map(() => makeUid())));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the length should trigger a resync
  }, [items.length]);

  // Auto-expand a row that gained a descendant error after a failed save.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a failed-save result from outside this component, not derived render state
    setCollapsed((prev) => {
      let changed = false;
      const next = { ...prev };
      items.forEach((_, index) => {
        const uid = uids[index];
        if (uid && hasErrorUnder(errors, `${path}.${index}`) && next[uid]) {
          next[uid] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately keyed on errors only
  }, [errors]);

  useEffect(() => {
    if (focusUid) {
      rowRefs.current[focusUid]?.focus();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a one-shot "focus this row" request after the DOM side effect runs
      setFocusUid(null);
    }
  }, [focusUid]);

  if (field.kind !== "repeater") return null;
  // Destructured into their own bindings: TS control-flow narrowing on
  // `field` itself doesn't persist into the nested closures below.
  const { fields: childFields, itemLabel, newItem, label, help } = field;
  const max = field.max ?? 20;
  const min = field.min ?? 0;
  const atMax = items.length >= max;
  const atMin = items.length <= min;

  function add() {
    const uid = makeUid();
    setUidsState((prev) => [...prev, uid]);
    onChange([...items, newItem()]);
    setFocusUid(uid);
  }

  function remove(index: number) {
    const item = items[index];
    const hasContent = item && typeof item === "object" && Object.values(item).some(Boolean);
    if (hasContent && !window.confirm("Remove this item? It has content that will be lost.")) return;
    setUidsState((prev) => prev.filter((_, i) => i !== index));
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const nextItems = items.slice();
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    const nextUids = uids.slice();
    [nextUids[index], nextUids[target]] = [nextUids[target], nextUids[index]];
    setUidsState(nextUids);
    onChange(nextItems);
    setFocusUid(nextUids[target]);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      {help && <p className="mb-1.5 text-xs text-grey-500">{help}</p>}

      <div className="space-y-2">
        {items.map((item, index) => {
          const uid = uids[index] ?? `fallback-${index}`;
          return (
            <RepeaterRow
              key={uid}
              ref={(el) => {
                rowRefs.current[uid] = el;
              }}
              index={index}
              item={item}
              fields={childFields}
              itemLabel={itemLabel}
              path={`${path}.${index}`}
              errors={errors}
              collapsed={Boolean(collapsed[uid])}
              onToggle={() => setCollapsed((prev) => ({ ...prev, [uid]: !prev[uid] }))}
              onFieldChange={(childName, v) => onChange(setIn(items, `${index}.${childName}`, v))}
              onRemove={() => remove(index)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              canRemove={!atMin}
            />
          );
        })}
      </div>

      <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={add} disabled={atMax}>
        Add item
      </Button>
      {errors[path] && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {errors[path]}
        </p>
      )}
    </div>
  );
}
