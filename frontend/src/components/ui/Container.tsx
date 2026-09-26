import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ContainerOwnProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
};

type ContainerProps<T extends ElementType> = ContainerOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>;

/**
 * The single contained-width wrapper for the whole site. See
 * .claude/skills/responsive-layout/SKILL.md — max width and gutters are
 * expressed in rem via the `.container-x` utility so they participate in
 * the fluid root font-size scale on very large screens.
 */
export function Container<T extends ElementType = "div">({
  as,
  className = "",
  children,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={`container-x ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
