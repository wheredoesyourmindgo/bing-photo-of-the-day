import {captionPlacement, type CaptionConfig} from '@/lib/caption'
import {cn} from '@/lib/utils'

interface CaptionProps {
  config: CaptionConfig
  copyright: string
  copyrightHref: string
}

/**
 * The copyright caption pill. Shared by the live page and the playground
 * preview so placement is guaranteed identical. Renders nothing unless the
 * config says to show it and Bing actually gave us caption text + a link.
 */
export function Caption({config, copyright, copyrightHref}: CaptionProps) {
  if (!config.show || !copyright || !copyrightHref) return null

  return (
    <a
      href={copyrightHref}
      target="_blank"
      rel="noopener noreferrer"
      style={captionPlacement(config)}
      className={cn(
        'font-caption z-10 rounded bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/70',
        // Single line by default; opt into wrapping (capped width) via `wrap`.
        config.wrap ? 'max-w-[min(90vw,28rem)]' : 'whitespace-nowrap'
      )}
    >
      {copyright}
    </a>
  )
}
