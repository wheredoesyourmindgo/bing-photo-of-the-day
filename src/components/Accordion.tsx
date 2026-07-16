'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger as BaseAccordionTrigger
} from '@/components/ui/accordion'
import {cn} from '@/lib/utils'

type AccordionTriggerProps = React.ComponentProps<
  typeof BaseAccordionTrigger
> & {
  animate?: boolean
}

function AccordionTrigger({
  className,
  animate = true,
  ...props
}: AccordionTriggerProps) {
  return (
    <BaseAccordionTrigger
      className={cn(
        animate && [
          // The vendor trigger renders two icons (chevron-down, chevron-up)
          // and hard-swaps their display via aria-expanded, so neither can be
          // transitioned. Force only the first (down) icon to ever render,
          // and rotate it with a transition instead. Base UI's accordion has
          // no data-state attribute — only a boolean data-panel-open on the
          // trigger — so that's what drives the rotated state.
          '[&_[data-slot=accordion-trigger-icon]:first-of-type]:inline!',
          '[&_[data-slot=accordion-trigger-icon]:last-of-type]:hidden!',
          'motion-safe:[&_[data-slot=accordion-trigger-icon]:first-of-type]:transition-transform motion-safe:[&_[data-slot=accordion-trigger-icon]:first-of-type]:duration-300',
          '[&[data-panel-open]_[data-slot=accordion-trigger-icon]:first-of-type]:rotate-180'
        ],
        className
      )}
      {...props}
    />
  )
}

export {Accordion, AccordionContent, AccordionItem, AccordionTrigger}
