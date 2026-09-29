/**
 * BEM (Block Element Modifier) Utility
 * Provides helper functions for creating BEM-compliant class names
 */

export function bem(
  block: string,
  element?: string,
  modifier?: string | string[]
): string {
  const classes: string[] = [block];

  if (element) {
    classes.push(`${block}__${element}`);
  }

  if (modifier) {
    const modifiers = Array.isArray(modifier) ? modifier : [modifier];
    classes.push(...modifiers.map((m) => `${block}--${m}`));
  }

  return classes.join(' ');
}

/**
 * Creates a BEM class name with variants
 */
export function bemVariant(
  block: string,
  element?: string,
  variants?: Record<string, boolean>
): string {
  const classes: string[] = [block];

  if (element) {
    classes.push(`${block}__${element}`);
  }

  if (variants) {
    const activeVariants = Object.entries(variants)
      .filter(([_, value]) => value)
      .map(([key]) => `${block}--${key}`);
    classes.push(...activeVariants);
  }

  return classes.join(' ');
}

/**
 * Combines multiple BEM class names
 */
export function bemCombine(...classNames: (string | undefined | null)[]): string {
  return classNames.filter(Boolean).join(' ');
}
