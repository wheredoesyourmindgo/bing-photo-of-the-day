'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {Eye, Shuffle, X} from 'lucide-react'
import {Caption} from '@/components/caption'
import {Chico} from '@/components/chico'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/Accordion'
import {CopyButton} from '@/components/CopyButton'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {
  captionParamsToQuery,
  CaptionCorner,
  CaptionConfig,
  DEFAULT_CORNER,
  DEFAULT_OFFSET,
  MAX_OFFSET,
  MIN_OFFSET
} from '@/lib/caption'
import {
  chicoParamsToQuery,
  rollChico,
  ChicoConfig,
  ChicoRoll,
  ChicoSide,
  DEFAULT_CHICO_POS,
  DEFAULT_CHICO_SIDES,
  DEFAULT_CHICO_SIZE,
  MAX_CHICO_SIZE,
  MIN_CHICO_SIZE
} from '@/lib/chico'

/** How long the full-screen preview stays up before returning to the controls. */
const PREVIEW_SECONDS = 8

interface PlaygroundProps {
  imageUrl: string
  title: string
  copyright: string
  copyrightHref: string
}

const CORNER_OPTIONS: {value: CaptionCorner; label: string}[] = [
  {value: 'tl', label: 'Top left'},
  {value: 'tr', label: 'Top right'},
  {value: 'bl', label: 'Bottom left'},
  {value: 'br', label: 'Bottom right'}
]

const SIDE_OPTIONS: {value: ChicoSide; label: string}[] = [
  {value: 'top', label: 'Top'},
  {value: 'bottom', label: 'Bottom'},
  {value: 'left', label: 'Left'},
  {value: 'right', label: 'Right'}
]

const DEFAULT_CHICO_CONFIG: ChicoConfig = {
  show: false,
  sides: [...DEFAULT_CHICO_SIDES],
  random: false,
  pos: DEFAULT_CHICO_POS,
  size: DEFAULT_CHICO_SIZE
}

export function Playground({
  imageUrl,
  title,
  copyright,
  copyrightHref
}: PlaygroundProps) {
  const [config, setConfig] = useState<CaptionConfig>({
    show: true,
    corner: DEFAULT_CORNER,
    x: DEFAULT_OFFSET,
    y: DEFAULT_OFFSET,
    wrap: false
  })
  const [chico, setChico] = useState<ChicoConfig>(DEFAULT_CHICO_CONFIG)

  // The resolved side/position Chico is actually shown at. Kept out of `chico`
  // (and the URL) and only ever rolled from a user interaction (never at mount
  // / in an effect), so the SSR and first-client render agree — no hydration
  // mismatch. Starts at the deterministic default (single side, centered).
  const [roll, setRoll] = useState<ChicoRoll>({
    side: DEFAULT_CHICO_SIDES[0],
    pos: DEFAULT_CHICO_POS
  })

  // Re-roll when the candidate sides change (a fresh side pick, if there's more
  // than one) or when random position turns on. Other edits (pos/size, or
  // random turning off) keep the current roll.
  const handleChicoChange = useCallback(
    (next: ChicoConfig) => {
      setChico(next)
      const sidesChanged = next.sides !== chico.sides
      const randomTurnedOn = next.random && !chico.random
      if (sidesChanged || randomTurnedOn) {
        setRoll(rollChico(next))
      }
    },
    [chico]
  )

  // `roll` only holds outcomes that are actually random (the side pick, when
  // ambiguous; the position, when `chico.random`). For everything else, read
  // straight from `chico` so e.g. dragging the position slider — which never
  // triggers a re-roll above — shows up immediately, instead of only taking
  // effect the next time something re-rolls.
  const resolvedRoll: ChicoRoll = {
    side: chico.sides.length > 1 ? roll.side : (chico.sides[0] ?? roll.side),
    pos: chico.random ? roll.pos : chico.pos
  }

  const query = useMemo(
    () =>
      [captionParamsToQuery(config), chicoParamsToQuery(chico)]
        .filter(Boolean)
        .join('&'),
    [config, chico]
  )

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Photo of the Day · playground
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure the display, preview it live, then copy the URL to use —
            the same settings drive the{' '}
            <Link href="/" className="underline underline-offset-4">
              live page
            </Link>
            .
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Controls
            config={config}
            onChange={setConfig}
            chico={chico}
            onChicoChange={handleChicoChange}
            onShuffle={() => setRoll(rollChico(chico, resolvedRoll))}
          />

          <div className="flex min-w-0 flex-col gap-4">
            <PreviewPane
              config={config}
              chico={chico}
              chicoRoll={resolvedRoll}
              imageUrl={imageUrl}
              title={title}
              copyright={copyright}
              copyrightHref={copyrightHref}
            />
            <UrlBox query={query} />
          </div>
        </div>
      </main>

      <FullScreenPreview
        config={config}
        chico={chico}
        chicoRoll={resolvedRoll}
        imageUrl={imageUrl}
        title={title}
        copyright={copyright}
        copyrightHref={copyrightHref}
      />
    </>
  )
}

function Controls({
  config,
  onChange,
  chico,
  onChicoChange,
  onShuffle
}: {
  config: CaptionConfig
  onChange: (next: CaptionConfig) => void
  chico: ChicoConfig
  onChicoChange: (next: ChicoConfig) => void
  onShuffle: () => void
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <Section title="Caption">
          <ToggleRow
            id="show-caption"
            label="Show caption"
            checked={config.show}
            onChange={(show) => onChange({...config, show})}
          />

          <fieldset
            className="flex flex-col gap-4 disabled:opacity-50"
            disabled={!config.show}
          >
            <Field label="Corner">
              <div className="flex flex-col gap-2">
                <CornerToggleRow
                  options={CORNER_OPTIONS.slice(0, 2)}
                  corner={config.corner}
                  onChange={(corner) => onChange({...config, corner})}
                />
                <CornerToggleRow
                  options={CORNER_OPTIONS.slice(2, 4)}
                  corner={config.corner}
                  onChange={(corner) => onChange({...config, corner})}
                />
              </div>
            </Field>

            <OffsetSlider
              label="Horizontal offset"
              value={config.x}
              onChange={(x) => onChange({...config, x})}
            />
            <OffsetSlider
              label="Vertical offset"
              value={config.y}
              onChange={(y) => onChange({...config, y})}
            />

            <ToggleRow
              id="wrap-caption"
              label="Allow line breaks"
              checked={config.wrap}
              onChange={(wrap) => onChange({...config, wrap})}
            />

            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 self-start"
              onClick={() =>
                onChange({
                  ...config,
                  corner: DEFAULT_CORNER,
                  x: DEFAULT_OFFSET,
                  y: DEFAULT_OFFSET
                })
              }
            >
              Reset placement
            </Button>
          </fieldset>
        </Section>

        <Accordion className="-mt-2 rounded-none border-0">
          <AccordionItem value="chico" className="data-open:bg-transparent">
            <AccordionTrigger className="-mx-2 p-2">Advanced</AccordionTrigger>
            <AccordionContent className="px-0 pt-4">
              <ChicoControls
                chico={chico}
                onChange={onChicoChange}
                onShuffle={onShuffle}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

/** The hidden "Chico" toy, tucked inside the Advanced accordion. */
function ChicoControls({
  chico,
  onChange,
  onShuffle
}: {
  chico: ChicoConfig
  onChange: (next: ChicoConfig) => void
  onShuffle: () => void
}) {
  return (
    <Section title="Chico">
      <ToggleRow
        id="show-chico"
        label="Show Chico"
        checked={chico.show}
        onChange={(show) => onChange({...chico, show})}
      />

      <fieldset
        className="flex flex-col gap-4 disabled:opacity-50"
        disabled={!chico.show}
      >
        <Field label="Sides">
          <ToggleGroup
            variant="outline"
            spacing={0}
            multiple
            value={chico.sides}
            onValueChange={(value) => {
              // Keep at least one side selected so there's always a Chico.
              const sides = value as ChicoSide[]
              if (sides.length > 0) onChange({...chico, sides})
            }}
            className="w-full"
          >
            {SIDE_OPTIONS.map(({value, label}) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={label}
                className="flex-1"
              >
                <span className="text-xs">{label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {chico.sides.length > 1 && (
            <p className="text-muted-foreground text-xs">
              With more than one side picked, Chico shows up on one of them at
              random (separate from the random position option below).
            </p>
          )}
          {(chico.random || chico.sides.length > 1) && (
            <Button
              variant="outline"
              size="xs"
              className="self-start"
              onClick={onShuffle}
            >
              <Shuffle className="size-3" />
              Shuffle Live Preview
            </Button>
          )}
        </Field>

        <ToggleRow
          id="chico-random"
          label="Random position"
          checked={chico.random}
          onChange={(random) => onChange({...chico, random})}
        />

        {!chico.random && (
          <PercentSlider
            label="Position"
            value={chico.pos}
            min={0}
            max={100}
            onChange={(pos) => onChange({...chico, pos})}
          />
        )}

        <PercentSlider
          label="Size"
          value={chico.size}
          min={MIN_CHICO_SIZE}
          max={MAX_CHICO_SIZE}
          onChange={(size) => onChange({...chico, size})}
        />

        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={() =>
            onChange({
              ...chico,
              sides: [...DEFAULT_CHICO_SIDES],
              random: false,
              pos: DEFAULT_CHICO_POS,
              size: DEFAULT_CHICO_SIZE
            })
          }
        >
          Reset Chico
        </Button>
      </fieldset>
    </Section>
  )
}

/** A titled group of related settings. New setting groups slot in as siblings. */
function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** A label paired with an inline control (e.g. a switch), on one row. */
function ToggleRow({
  id,
  label,
  checked,
  onChange
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** A label stacked above its control. */
function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/**
 * One row of a joined, toolbar-style toggle group (shared borders, rounded
 * only at the row's two ends) — full corner labels don't fit in a single row,
 * so {@link CORNER_OPTIONS} renders as two of these, split top/bottom.
 */
function CornerToggleRow({
  options,
  corner,
  onChange
}: {
  options: {value: CaptionCorner; label: string}[]
  corner: CaptionCorner
  onChange: (corner: CaptionCorner) => void
}) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[corner]}
      onValueChange={(value) => {
        // Base UI toggle-groups carry an array; ignore the empty case so a
        // corner is always selected (radio-like).
        const next = value[0]
        if (next) onChange(next as CaptionCorner)
      }}
      className="w-full"
    >
      {options.map(({value, label}) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="flex-1"
        >
          <span className="text-xs">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function OffsetSlider({
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground font-mono text-xs">
          {value}px
        </span>
      </div>
      <Slider
        min={MIN_OFFSET}
        max={MAX_OFFSET}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

/** Like {@link OffsetSlider} but reads out a percentage over a caller-set range. */
function PercentSlider({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground font-mono text-xs">
          {value}%
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

function PreviewPane({
  config,
  chico,
  chicoRoll,
  imageUrl,
  title,
  copyright,
  copyrightHref
}: {
  config: CaptionConfig
  chico: ChicoConfig
  chicoRoll: ChicoRoll
} & PlaygroundProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="[container-type:size] relative aspect-video w-full overflow-hidden rounded-lg border">
        <Image
          fill
          quality={75}
          src={imageUrl}
          alt={title || 'Bing Photo of the Day'}
          className="object-cover"
          sizes="(min-width: 1024px) 60vw, 100vw"
        />
        <Chico config={chico} roll={chicoRoll} />
        <Caption
          config={config}
          copyright={copyright}
          copyrightHref={copyrightHref}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Live preview — offsets are shown in real pixels, so they look larger
        here than on a full-screen display. Use{' '}
        <span className="font-medium">Preview</span> for the true result.
      </p>
    </div>
  )
}

/** window.location.origin never changes for the life of the page, so there's nothing to subscribe to. */
function subscribeToOrigin() {
  return () => {}
}

function UrlBox({query}: {query: string}) {
  // Origin is only known in the browser. useSyncExternalStore renders the SSR
  // snapshot ('') on the server and on the first client pass, then swaps in
  // the real origin through a normal (non-hydration) commit — no effect, no
  // hydration mismatch to suppress.
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => ''
  )

  const url = `${origin}${query ? `?${query}` : ''}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">URL to use</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted flex items-center overflow-hidden rounded-md">
          <code className="min-w-0 flex-1 overflow-x-auto py-2 pl-3 font-mono text-sm whitespace-nowrap">
            {url || '…'}
          </code>
          <CopyButton
            variant="ghost"
            content={url}
            aria-label="Copy URL"
            className="mr-1 shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function FullScreenPreview({
  config,
  chico,
  chicoRoll,
  imageUrl,
  title,
  copyright,
  copyrightHref
}: {
  config: CaptionConfig
  chico: ChicoConfig
  chicoRoll: ChicoRoll
} & PlaygroundProps) {
  const [open, setOpen] = useState(false)
  const [remaining, setRemaining] = useState(PREVIEW_SECONDS)

  const start = useCallback(() => {
    setRemaining(PREVIEW_SECONDS)
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick)
          setOpen(false)
          return 0
        }
        return r - 1
      })
    }, 1000)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      clearInterval(tick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <Button
        size="lg"
        onClick={start}
        className="fixed right-4 bottom-4 z-20 shadow-lg"
      >
        <Eye className="size-4" />
        Preview
      </Button>

      {open && (
        <div className="animate-in fade-in [container-type:size] fixed inset-0 z-50 bg-black duration-300">
          <Image
            fill
            priority
            quality={100}
            src={imageUrl}
            alt={title || 'Bing Photo of the Day'}
            className="object-cover"
          />
          <Chico config={chico} roll={chicoRoll} />
          <Caption
            config={config}
            copyright={copyright}
            copyrightHref={copyrightHref}
          />

          <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
            <span className="flex items-center gap-1">
              <span>Returning in</span>
              <span className="font-mono tabular-nums">{remaining}s</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
            >
              <X className="size-3" />
              Exit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
