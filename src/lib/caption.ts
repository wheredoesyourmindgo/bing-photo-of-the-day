/**
 * The copyright-caption overlay's URL contract, shared by the live page ("/")
 * and the interactive playground ("/playground") so both render placement the exact
 * same way.
 *
 * URL params (all optional):
 *   caption=true     show the caption at all (anything else hides it)
 *                    (copyright=true is accepted as a legacy alias)
 *   pos=br|bl|tr|tl  which corner to anchor to (default br = bottom-right)
 *   x=<px>           distance from the left/right edge  (default 8)
 *   y=<px>           distance from the top/bottom edge  (default 8)
 *   wrap=true        allow the caption to wrap onto multiple lines
 *                    (default: single line, no wrapping)
 */
import type {CSSProperties} from 'react'

/** Which corner the caption anchors to. */
export type CaptionCorner = 'br' | 'bl' | 'tr' | 'tl'

export const CAPTION_CORNERS: readonly CaptionCorner[] = [
  'tl',
  'tr',
  'bl',
  'br'
]

/** Defaults match the original `right-2 bottom-2` styling (0.5rem = 8px). */
export const DEFAULT_CORNER: CaptionCorner = 'br'
export const DEFAULT_OFFSET = 8

/** Clamp range for offsets, so a hand-edited URL can't fling the pill off-screen. */
export const MIN_OFFSET = 0
export const MAX_OFFSET = 200

/** The normalized, validated caption configuration. */
export interface CaptionConfig {
  show: boolean
  corner: CaptionCorner
  x: number
  y: number
  /** Allow the caption to wrap onto multiple lines. Defaults to false. */
  wrap: boolean
}

/** The raw search params we read, as delivered by Next's `searchParams`. */
export interface CaptionParams {
  /** Show the caption. `copyright` is a legacy alias for the same thing. */
  caption?: string
  copyright?: string
  pos?: string
  x?: string
  y?: string
  wrap?: string
}

function isCorner(value: string | undefined): value is CaptionCorner {
  return value === 'br' || value === 'bl' || value === 'tr' || value === 'tl'
}

/** Parse a px offset, falling back to the default and clamping to a sane range. */
function parseOffset(value: string | undefined): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_OFFSET
  return Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, Math.round(n)))
}

/** Turn raw URL params into a validated {@link CaptionConfig}. */
export function parseCaptionParams(params: CaptionParams = {}): CaptionConfig {
  return {
    show:
      params.caption?.toLowerCase() === 'true' ||
      params.copyright?.toLowerCase() === 'true',
    corner: isCorner(params.pos) ? params.pos : DEFAULT_CORNER,
    x: parseOffset(params.x),
    y: parseOffset(params.y),
    wrap: params.wrap?.toLowerCase() === 'true'
  }
}

/** Serialize a config back into a query string (e.g. for the "copy URL" box). */
export function captionParamsToQuery(config: CaptionConfig): string {
  const q = new URLSearchParams()
  if (config.show) q.set('caption', 'true')
  if (config.corner !== DEFAULT_CORNER) q.set('pos', config.corner)
  if (config.x !== DEFAULT_OFFSET) q.set('x', String(config.x))
  if (config.y !== DEFAULT_OFFSET) q.set('y', String(config.y))
  if (config.wrap) q.set('wrap', 'true')
  return q.toString()
}

/**
 * The absolute-positioning styles for the caption, given a config. The corner
 * decides which two edges we anchor to; the offsets are the distances from
 * them. `textAlign` keeps a wrapped caption reading toward its anchored corner.
 */
export function captionPlacement(config: CaptionConfig): CSSProperties {
  const isBottom = config.corner === 'br' || config.corner === 'bl'
  const isRight = config.corner === 'br' || config.corner === 'tr'
  return {
    position: 'absolute',
    [isBottom ? 'bottom' : 'top']: config.y,
    [isRight ? 'right' : 'left']: config.x,
    textAlign: isRight ? 'right' : 'left'
  }
}
