import Image from 'next/image'
import {
  chicoPlacement,
  CHICO_VARIANTS,
  resolvedChicoSize,
  type ChicoConfig,
  type ChicoRoll
} from '@/lib/chico'

interface ChicoProps {
  config: ChicoConfig
  /**
   * The resolved photo/side/position to render. The caller owns the roll so a
   * render stays deterministic (the live page rolls once per request; the
   * playground keeps it in state, only re-rolling on the interactions that
   * warrant it).
   */
  roll: ChicoRoll
}

/**
 * Chico, the optional office-dog overlay — only ever one at a time, sized in
 * `cqmin` (percent of the frame's shorter side), so the parent frame MUST
 * establish a size container (`[container-type:size]`). Sits behind the
 * caption pill and never intercepts clicks, so an enabled caption stays usable.
 */
export function Chico({config, roll}: ChicoProps) {
  if (!config.show) return null

  const variant = CHICO_VARIANTS[roll.variant]
  const size = resolvedChicoSize(config, variant)
  const {box, art} = chicoPlacement(roll, size, variant)

  return (
    <div
      aria-hidden
      style={box}
      className="pointer-events-none absolute select-none"
    >
      <div style={art}>
        <Image
          src={variant.url}
          alt=""
          width={variant.width}
          height={variant.height}
          className="size-full drop-shadow-lg"
          sizes="60vw"
        />
      </div>
    </div>
  )
}
