/**
 * Chico — a silly, optional overlay of the office dog. Like the caption, Chico
 * has a small URL contract shared by the live page ("/") and the playground
 * ("/playground") so a configured Chico rides along on the shareable URL and
 * renders identically in both places. He sits *behind* the caption (the caption
 * pill is `z-10`; Chico is unlayered), so enabling both keeps the caption on top.
 *
 * Only one Chico ever shows at a time. `sides` is the set of edges he's allowed
 * to sit on — with one side picked, he sits there; with two or more, one is
 * chosen at random each time the config changes (a side-selection roll, kept
 * separate from the `random`-position roll below).
 *
 * URL params (all optional):
 *   chico=true            show Chico at all (anything else hides him)
 *   chicoSides=bottom,left  candidate edges, comma-separated — one is picked
 *                           at random when more than one is listed
 *                           (default `bottom`; unknown values are dropped)
 *   chicoRandom=true      randomize Chico's position along whichever edge is
 *                         picked; the `chicoPos` slider is ignored (default false)
 *   chicoPos=<0-100>      percent along the edge's axis, centered on the point
 *                         (default 50; ignored when chicoRandom=true)
 *   chicoSize=<5-60>      size as a percent of the frame's shorter side
 *                         (default 25)
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
 * The Chico photos, in a stable order. Add more here over time — the array is
 * the only place that needs to change to grow the roster. Use transparent PNGs
 * (JPG has no alpha channel), so Chico cuts out cleanly over the photo.
 */
export const CHICO_IMAGES = ['/images/Chico_1.png'] as const

/**
 * The roster's intrinsic pixel size — used both as `next/image`'s required
 * width/height and to compute how tall he renders relative to his width (see
 * {@link CHICO_ASPECT}). He's not perfectly square, which matters once he's
 * rotated onto the left/right edges.
 */
export const CHICO_IMAGE_WIDTH = 1797
export const CHICO_IMAGE_HEIGHT = 1673

/** Height/width ratio at his natural, upright size. */
const CHICO_ASPECT = CHICO_IMAGE_HEIGHT / CHICO_IMAGE_WIDTH

/** Sensible defaults: hidden, sitting on the bottom edge, left corner, mid-size. */
export const DEFAULT_CHICO_SIDES: ChicoSide[] = ['bottom']
export const DEFAULT_CHICO_POS = 15

/** Size clamp (percent of the frame's shorter side), so a hand-edited URL stays sane. */
export const DEFAULT_CHICO_SIZE = 25
export const MIN_CHICO_SIZE = 5
export const MAX_CHICO_SIZE = 60

/** The normalized, validated Chico configuration. */
export interface ChicoConfig {
  show: boolean
  /** Candidate edges; one is picked (at random, if there's more than one). Never empty. */
  sides: ChicoSide[]
  /** Randomize position along the picked edge, ignoring `pos`. Defaults to false. */
  random: boolean
  /** Percent (0-100) along the picked edge's axis, centered on the point. */
  pos: number
  /** Size as a percent (5-60) of the frame's shorter side. */
  size: number
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

/** Parse a comma-separated side list, dropping unknowns, falling back to the default. */
function parseSides(value: string | undefined): ChicoSide[] {
  if (!value) return [...DEFAULT_CHICO_SIDES]
  const sides = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(isSide)
  // De-dupe while preserving order; never hand back an empty list.
  const unique = [...new Set(sides)]
  return unique.length > 0 ? unique : [...DEFAULT_CHICO_SIDES]
}

/** Parse a clamped percentage, falling back to a default. */
function parsePercent(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Turn raw URL params into a validated {@link ChicoConfig}. */
export function parseChicoParams(params: ChicoParams = {}): ChicoConfig {
  return {
    show: params.chico?.toLowerCase() === 'true',
    sides: parseSides(params.chicoSides),
    random: params.chicoRandom?.toLowerCase() === 'true',
    pos: parsePercent(params.chicoPos, DEFAULT_CHICO_POS, 0, 100),
    size: parsePercent(
      params.chicoSize,
      DEFAULT_CHICO_SIZE,
      MIN_CHICO_SIZE,
      MAX_CHICO_SIZE
    )
  }
}

/** Whether a side list differs from the default (order-insensitive). */
function sidesAreDefault(sides: ChicoSide[]): boolean {
  return (
    sides.length === DEFAULT_CHICO_SIDES.length &&
    DEFAULT_CHICO_SIDES.every((s) => sides.includes(s))
  )
}

/** Serialize a config back into a query string (e.g. for the "copy URL" box). */
export function chicoParamsToQuery(config: ChicoConfig): string {
  const q = new URLSearchParams()
  if (!config.show) return ''
  q.set('chico', 'true')
  if (!sidesAreDefault(config.sides))
    q.set('chicoSides', config.sides.join(','))
  if (config.random) q.set('chicoRandom', 'true')
  // `pos` is meaningless while random, so only serialize it otherwise.
  if (!config.random && config.pos !== DEFAULT_CHICO_POS) {
    q.set('chicoPos', String(config.pos))
  }
  if (config.size !== DEFAULT_CHICO_SIZE)
    q.set('chicoSize', String(config.size))
  return q.toString()
}

/** A resolved Chico instance: the one side he's on, and how far along it. */
export interface ChicoRoll {
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
  if (sides.length <= 1) return sides[0] ?? DEFAULT_CHICO_SIDES[0]
  const candidates = exclude ? sides.filter((s) => s !== exclude) : sides
  const pool = candidates.length > 0 ? candidates : sides
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Roll a fresh position (0-100). */
export function rollChicoPosition(): number {
  return Math.round(Math.random() * 100)
}

/**
 * Resolve a config into one {@link ChicoRoll}, rolling only the parts that are
 * actually random: the side (if multiple are candidates) and the position (if
 * `config.random` is on). Callers own when this runs so a render stays
 * deterministic — the live page rolls once per request; the playground rolls
 * from state, only on the interactions that should produce a new look.
 *
 * `previous`, if given, is the roll currently on screen — its side is excluded
 * from the redraw (see {@link pickChicoSide}) so re-rolling always changes
 * something visible.
 */
export function rollChico(
  config: ChicoConfig,
  previous?: ChicoRoll
): ChicoRoll {
  return {
    side: pickChicoSide(config.sides, previous?.side),
    pos: config.random ? rollChicoPosition() : config.pos
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
 * Splitting these is what keeps him flush with the edge on left/right: he's
 * not quite square (see {@link CHICO_ASPECT}), so a single rotated element
 * would leave a gap between the rotated content and the edge it's anchored
 * to — rotating a box doesn't change the box's own (still-upright) layout
 * size, only how its content is painted inside it.
 */
export interface ChicoPlacement {
  box: CSSProperties
  art: CSSProperties
}

export function chicoPlacement(
  {side, pos}: ChicoRoll,
  size: number
): ChicoPlacement {
  const rotated = side === 'left' || side === 'right'
  const width = rotated ? size * CHICO_ASPECT : size
  const height = rotated ? size : size * CHICO_ASPECT

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
    height: `${size * CHICO_ASPECT}cqmin`,
    transform: `translate(-50%, -50%) rotate(${rotationForSide(side)}deg)`
  }

  return {box, art}
}
