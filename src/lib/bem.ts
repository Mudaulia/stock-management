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

export function bemVariant(
  bemFn: ReturnType<typeof bem>,
  element: string,
  modifier: string,
  condition: boolean
) {
  return condition ? bemFn.e(element, modifier) : bemFn.e(element)
}
