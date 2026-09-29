/**
 * BEM (Block Element Modifier) CSS naming convention utility
 * 
 * Usage:
 * ```tsx
 * const bemBlock = bem('block-name')
 * 
 * <div className={bemBlock()}>
 *   <div className={bemBlock('element')}>
 *     <div className={bemBlock('element', 'modifier')}>
 *       Content
 *     </div>
 *   </div>
 * </div>
 * ```
 * 
 * Output:
 * ```html
 * <div class="block-name">
 *   <div class="block-name__element">
 *     <div class="block-name__element block-name__element--modifier">
 *       Content
 *     </div>
 *   </div>
 * </div>
 * ```
 */

export function bem(block: string) {
  return {
    b: (element?: string, modifier?: string) => {
      const classes: string[] = [block]
      
      if (element) {
        classes.push(`${block}__${element}`)
      }
      
      if (modifier) {
        classes.push(`${block}__${element}--${modifier}`)
      }
      
      return classes.join(' ')
    },
    
    e: (element: string, modifier?: string) => {
      const classes: string[] = [`${block}__${element}`]
      
      if (modifier) {
        classes.push(`${block}__${element}--${modifier}`)
      }
      
      return classes.join(' ')
    },
    
    m: (modifier: string) => {
      return `${block}--${modifier}`
    },
  }
}

/**
 * Variant helper for conditional modifiers
 * 
 * Usage:
 * ```tsx
 * <div className={cn(
 *   bemBlock('element'),
 *   bemVariant(bemBlock, 'element', 'modifier', condition)
 * )}>
 *   Content
 * </div>
 * ```
 */
export function bemVariant(
  bemFn: ReturnType<typeof bem>,
  element: string,
  modifier: string,
  condition: boolean
) {
  return condition ? bemFn.e(element, modifier) : bemFn.e(element)
}
