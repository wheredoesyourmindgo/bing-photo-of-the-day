import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  // eslint-disable-next-line tailwindcss/no-custom-classname -- `inputs` is a dynamic arg, not a class literal
  return twMerge(clsx(inputs))
}
