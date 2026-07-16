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
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  X
} from 'lucide-react'
import {Caption} from '@/components/caption'
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

/** How long the full-screen preview stays up before returning to the controls. */
const PREVIEW_SECONDS = 8

interface PlaygroundProps {
  imageUrl: string
  title: string
  copyright: string
  copyrightHref: string
}

const CORNER_OPTIONS: {
  value: CaptionCorner
  label: string
  Icon: typeof ArrowUpLeft
}[] = [
  {value: 'tl', label: 'Top left', Icon: ArrowUpLeft},
  {value: 'tr', label: 'Top right', Icon: ArrowUpRight},
  {value: 'bl', label: 'Bottom left', Icon: ArrowDownLeft},
  {value: 'br', label: 'Bottom right', Icon: ArrowDownRight}
]

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

  const query = useMemo(() => captionParamsToQuery(config), [config])

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
          <Controls config={config} onChange={setConfig} />

          <div className="flex min-w-0 flex-col gap-4">
            <PreviewPane
              config={config}
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
  onChange
}: {
  config: CaptionConfig
  onChange: (next: CaptionConfig) => void
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
              <ToggleGroup
                variant="outline"
                spacing={4}
                value={[config.corner]}
                onValueChange={(value) => {
                  // Base UI toggle-groups carry an array; ignore the empty
                  // case so a corner is always selected (radio-like).
                  const next = value[0]
                  if (next) {
                    onChange({...config, corner: next as CaptionCorner})
                  }
                }}
                className="grid w-full grid-cols-2"
              >
                {CORNER_OPTIONS.map(({value, label, Icon}) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={label}
                    className="justify-start gap-2"
                  >
                    <Icon className="size-4" />
                    <span className="text-xs">{label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
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
      </CardContent>
    </Card>
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

function PreviewPane({
  config,
  imageUrl,
  title,
  copyright,
  copyrightHref
}: {config: CaptionConfig} & PlaygroundProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
        <Image
          fill
          quality={75}
          src={imageUrl}
          alt={title || 'Bing Photo of the Day'}
          className="object-cover"
          sizes="(min-width: 1024px) 60vw, 100vw"
        />
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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const url = `${origin}${query ? `?${query}` : ''}`

  // Derived, so editing the config after a copy clears the tick automatically
  // (no reset-in-effect) — the tick only shows for the URL that was copied.
  const copied = copiedUrl === url

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
    } catch {
      // Clipboard can be unavailable (insecure origin / denied permission);
      // the URL is still visible for a manual copy.
    }
  }, [url])

  // Clear the tick a couple seconds after a successful copy.
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopiedUrl(null), 2000)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">URL to use</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <code className="bg-muted min-w-0 flex-1 overflow-x-auto rounded px-3 py-2 font-mono text-xs whitespace-nowrap">
          {url || '…'}
        </code>
        <Button
          variant="outline"
          size="icon"
          aria-label="Copy URL"
          onClick={copy}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function FullScreenPreview({
  config,
  imageUrl,
  title,
  copyright,
  copyrightHref
}: {config: CaptionConfig} & PlaygroundProps) {
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
        <div className="animate-in fade-in fixed inset-0 z-50 bg-black duration-300">
          <Image
            fill
            priority
            quality={100}
            src={imageUrl}
            alt={title || 'Bing Photo of the Day'}
            className="object-cover"
          />
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
