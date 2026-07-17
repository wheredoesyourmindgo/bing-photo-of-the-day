/**
 * Chico — a silly, optional overlay of the office dog. Like the caption, Chico
 * has a small URL contract shared by the live page ("/") and the playground
 * ("/playground") so a configured Chico rides along on the shareable URL and
 * renders identically in both places. He sits *behind* the caption (the caption
 * pill is `z-10`; Chico is unlayered), so enabling both keeps the caption on top.
 *
 * Only one Chico ever shows at a time. Which *photo* shows is picked at random
 * from {@link CHICO_VARIANTS} — each request/shuffle draws fresh, the same way
 * the side/position rolls below already work — since photos, like sides, are a
 * candidate space rather than a URL-shareable setting. Each variant carries its
 * own natural resting spot (edge, position, size), used whenever the URL/config
 * doesn't explicitly override that setting. `sides` is the set of edges he's
 * allowed to sit on — with one side picked, he sits there; with two or more,
 * one is chosen at random each time the config changes (a side-selection roll,
 * kept separate from the `random`-position roll below).
 *
 * URL params (all optional):
 *   chico=true            show Chico at all (anything else hides him)
 *   chicoSides=bottom,left  candidate edges, comma-separated — one is picked
 *                           at random when more than one is listed
 *                           (default: the picked photo's own edge; unknown
 *                           values are dropped)
 *   chicoRandom=true      randomize Chico's position along whichever edge is
 *                         picked; the `chicoPos` slider is ignored (default false)
 *   chicoPos=<0-100>      percent along the edge's axis, centered on the point
 *                         (default: the picked photo's own position; ignored
 *                         when chicoRandom=true)
 *   chicoSize=<5-60>      size as a percent of the frame's shorter side
 *                         (default: the picked photo's own size)
 */
import type {CSSProperties} from 'react'

/** Which edge of the frame Chico can sit on. */
export type ChicoSide = 'top' | 'bottom' | 'left' | 'right'

export const CHICO_SIDES: readonly ChicoSide[] = [
  'top',
  'bottom',
  'left',
  'right'
]

/**
 * One Chico photo and the resting spot it was shot/cropped for — its own
 * intrinsic pixel size (also `next/image`'s required width/height) and the
 * edge/position/size it defaults to when nothing in the URL/config overrides
 * that setting. A photo posed hanging down from the top, for instance, would
 * set `side: 'top'` here rather than relying on a bottom-posed photo getting
 * rotated onto the top edge.
 */
export interface ChicoVariant {
  url: string
  width: number
  height: number
  side: ChicoSide
  pos: number
  size: number
}

/**
 * The Chico roster, in a stable order. Add more here over time — this array is
 * the only place that needs to change to grow it. Use transparent PNGs (JPG
 * has no alpha channel), so Chico cuts out cleanly over the photo.
 */
export const CHICO_VARIANTS: readonly ChicoVariant[] = [
  {
    url: 'https://ikytztnux2hjbem7.public.blob.vercel-storage.com/Chico_1.png',
    width: 1797,
    height: 1673,
    side: 'bottom',
    pos: 15,
    size: 25
  },
  {
    url: 'https://ikytztnux2hjbem7.public.blob.vercel-storage.com/Chico_2.png',
    width: 2056,
    height: 2330,
    side: 'top',
    pos: 15,
    size: 25
  }
]

/** Size clamp (percent of the frame's shorter side), so a hand-edited URL stays sane. */
export const MIN_CHICO_SIZE = 5
export const MAX_CHICO_SIZE = 60

/**
 * The normalized, validated Chico configuration. `sides`/`pos`/`size` are
 * `undefined` when not explicitly set (by the URL or a playground edit) — that
 * means "use whichever photo gets picked's own default," resolved via
 * {@link resolvedChicoSides}/{@link resolvedChicoPos}/{@link resolvedChicoSize}
 * once a {@link ChicoVariant} is known.
 */
export interface ChicoConfig {
  show: boolean
  /** Candidate edges; one is picked (at random, if there's more than one). */
  sides?: ChicoSide[]
  /** Randomize position along the picked edge, ignoring `pos`. Defaults to false. */
  random: boolean
  /** Percent (0-100) along the picked edge's axis, centered on the point. */
  pos?: number
  /** Size as a percent (5-60) of the frame's shorter side. */
  size?: number
}

/** The raw search params we read, as delivered by Next's `searchParams`. */
export interface ChicoParams {
  chico?: string
  chicoSides?: string
  chicoRandom?: string
  chicoPos?: string
  chicoSize?: string
}

function isSide(value: string): value is ChicoSide {
  return (CHICO_SIDES as readonly string[]).includes(value)
}

/** Parse a comma-separated side list, dropping unknowns; `undefined` if none given. */
function parseSides(value: string | undefined): ChicoSide[] | undefined {
  if (!value) return undefined
  const sides = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(isSide)
  // De-dupe while preserving order.
  const unique = [...new Set(sides)]
  return unique.length > 0 ? unique : undefined
}

/** Parse a clamped percentage; `undefined` if not given. */
function parsePercent(
  value: string | undefined,
  min: number,
  max: number
): number | undefined {
  if (value === undefined) return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Turn raw URL params into a validated {@link ChicoConfig}. */
export function parseChicoParams(params: ChicoParams = {}): ChicoConfig {
  return {
    show: params.chico?.toLowerCase() === 'true',
    sides: parseSides(params.chicoSides),
    random: params.chicoRandom?.toLowerCase() === 'true',
    pos: parsePercent(params.chicoPos, 0, 100),
    size: parsePercent(params.chicoSize, MIN_CHICO_SIZE, MAX_CHICO_SIZE)
  }
}

/** The edges Chico is allowed to sit on, falling back to the picked photo's own edge. */
export function resolvedChicoSides(
  config: ChicoConfig,
  variant: ChicoVariant
): ChicoSide[] {
  return config.sides && config.sides.length > 0 ? config.sides : [variant.side]
}

/** Chico's position, falling back to the picked photo's own position. */
export function resolvedChicoPos(
  config: ChicoConfig,
  variant: ChicoVariant
): number {
  return config.pos ?? variant.pos
}

/** Chico's size, falling back to the picked photo's own size. */
export function resolvedChicoSize(
  config: ChicoConfig,
  variant: ChicoVariant
): number {
  return config.size ?? variant.size
}

/** Serialize a config back into a query string (e.g. for the "copy URL" box). */
export function chicoParamsToQuery(config: ChicoConfig): string {
  const q = new URLSearchParams()
  if (!config.show) return ''
  q.set('chico', 'true')
  if (config.sides && config.sides.length > 0) {
    q.set('chicoSides', config.sides.join(','))
  }
  if (config.random) q.set('chicoRandom', 'true')
  // `pos` is meaningless while random, so only serialize it otherwise.
  if (!config.random && config.pos !== undefined) {
    q.set('chicoPos', String(config.pos))
  }
  if (config.size !== undefined) q.set('chicoSize', String(config.size))
  return q.toString()
}

/** A resolved Chico instance: which photo, which side he's on, and how far along it. */
export interface ChicoRoll {
  variant: number
  side: ChicoSide
  pos: number
}

/**
 * Pick which side Chico actually shows on. With one candidate it's used
 * directly; with two or more, one is chosen at random — only one Chico is ever
 * shown, so there's no picking "a couple" of the selected sides.
 *
 * `exclude`, if given, is left out of the draw when there's another option —
 * so re-rolling from a side that's currently showing (e.g. the playground's
 * Shuffle button) always lands somewhere new, instead of a coin-flip chance
 * of landing right back where it started with only two candidates.
 */
export function pickChicoSide(
  sides: ChicoSide[],
  exclude?: ChicoSide
): ChicoSide {
  if (sides.length <= 1) return sides[0] ?? CHICO_VARIANTS[0].side
  const candidates = exclude ? sides.filter((s) => s !== exclude) : sides
  const pool = candidates.length > 0 ? candidates : sides
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Pick which photo Chico shows as, the same way {@link pickChicoSide} picks a
 * side: at random across the whole roster, excluding `exclude` when there's
 * another option so a forced re-roll always changes something visible.
 */
export function pickChicoVariant(exclude?: number): number {
  if (CHICO_VARIANTS.length <= 1) return 0
  const indexes = CHICO_VARIANTS.map((_, i) => i)
  const candidates =
    exclude === undefined ? indexes : indexes.filter((i) => i !== exclude)
  const pool = candidates.length > 0 ? candidates : indexes
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Roll a fresh position (0-100). */
export function rollChicoPosition(): number {
  return Math.round(Math.random() * 100)
}

/**
 * Resolve a config into one {@link ChicoRoll}, rolling only the parts that are
 * actually random: which photo (see {@link pickChicoVariant}), the side (if
 * multiple are candidates), and the position (if `config.random` is on).
 * Callers own when this runs so a render stays deterministic — the live page
 * rolls once per request; the playground rolls from state, only on the
 * interactions that should produce a new look.
 *
 * `previous`, if given, is the roll currently on screen — its side is excluded
 * from the redraw (see {@link pickChicoSide}), and its photo is kept as-is
 * unless `rerollVariant` is set — so incidental config edits (e.g. dragging
 * the size slider) don't secretly swap the photo out from under the side/pos
 * roll, while an explicit reroll (e.g. the playground's Shuffle button) can
 * still draw a fresh one.
 */
export function rollChico(
  config: ChicoConfig,
  previous?: ChicoRoll,
  {rerollVariant = previous === undefined}: {rerollVariant?: boolean} = {}
): ChicoRoll {
  const variant = rerollVariant
    ? pickChicoVariant(previous?.variant)
    : (previous?.variant ?? pickChicoVariant())
  const resolvedVariant = CHICO_VARIANTS[variant]
  return {
    variant,
    side: pickChicoSide(
      resolvedChicoSides(config, resolvedVariant),
      previous?.side
    ),
    pos: config.random
      ? rollChicoPosition()
      : resolvedChicoPos(config, resolvedVariant)
  }
}

/**
 * How far to rotate Chico so his feet (not his head or side) are the part
 * touching the edge he's placed on — upside down at the top, sideways at the
 * left/right, upright at the bottom.
 */
function rotationForSide(side: ChicoSide): number {
  switch (side) {
    case 'bottom':
      return 0
    case 'top':
      return 180
    case 'left':
      return 90
    case 'right':
      return -90
  }
}

/**
 * The two style objects needed to render a resolved Chico:
 *
 * - `box`: the anchor — sized, positioned, and centered along its edge's axis
 *   (`pos`), with NO rotation. Left/right sides get his upright width/height
 *   swapped here, so the box's footprint already matches what he'll look like
 *   once rotated.
 * - `art`: centered inside `box` at his natural upright size, then rotated.
 *
 * Splitting these is what keeps him flush with the edge on left/right: a
 * variant's photo isn't necessarily square (see its `height`/`width`), so a
 * single rotated element would leave a gap between the rotated content and
 * the edge it's anchored to — rotating a box doesn't change the box's own
 * (still-upright) layout size, only how its content is painted inside it.
 */
export interface ChicoPlacement {
  box: CSSProperties
  art: CSSProperties
}

export function chicoPlacement(
  {side, pos}: ChicoRoll,
  size: number,
  variant: ChicoVariant
): ChicoPlacement {
  const aspect = variant.height / variant.width
  const rotated = side === 'left' || side === 'right'
  const width = rotated ? size * aspect : size
  const height = rotated ? size : size * aspect

  const box: CSSProperties = {
    position: 'absolute',
    width: `${width}cqmin`,
    height: `${height}cqmin`
  }
  switch (side) {
    case 'bottom':
      Object.assign(box, {
        bottom: 0,
        left: `${pos}%`,
        transform: 'translateX(-50%)'
      })
      break
    case 'top':
      Object.assign(box, {
        top: 0,
        left: `${pos}%`,
        transform: 'translateX(-50%)'
      })
      break
    case 'left':
      Object.assign(box, {
        left: 0,
        top: `${pos}%`,
        transform: 'translateY(-50%)'
      })
      break
    case 'right':
      Object.assign(box, {
        right: 0,
        top: `${pos}%`,
        transform: 'translateY(-50%)'
      })
      break
  }

  const art: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: `${size}cqmin`,
    height: `${size * aspect}cqmin`,
    transform: `translate(-50%, -50%) rotate(${rotationForSide(side)}deg)`
  }

  return {box, art}
}
