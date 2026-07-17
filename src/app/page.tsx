import Image from 'next/image'
import {Caption} from '@/components/caption'
import {Chico} from '@/components/chico'
import {parseCaptionParams, type CaptionParams} from '@/lib/caption'
import {parseChicoParams, rollChico, type ChicoParams} from '@/lib/chico'
import {getPhotoOfTheDay} from '@/lib/bing'

type HomeProps = {
  searchParams?: Promise<CaptionParams & ChicoParams>
}

export default async function Home({searchParams}: HomeProps) {
  const [{imageUrl, copyright, copyrightHref, title}, params] =
    await Promise.all([getPhotoOfTheDay(), searchParams])

  const config = parseCaptionParams(params)
  const chico = parseChicoParams(params)
  // Rolled fresh per request (this page isn't hydrated): picks a photo at
  // random from the roster, a side at random when multiple are candidates, and
  // a position when `chicoRandom=true`.
  const chicoRoll = rollChico(chico)

  return (
    // `[container-type:size]` makes the frame a size container so Chico can size
    // himself in `cqmin` (percent of the shorter side).
    <main className="[container-type:size] relative h-screen w-screen">
      <Image
        fill
        priority
        quality={100}
        src={imageUrl}
        alt={title || 'Bing Image of the Day'}
        className="object-cover"
      />

      {/* Chico sits behind the caption (which is z-10). */}
      <Chico config={chico} roll={chicoRoll} />

      <Caption
        config={config}
        copyright={copyright}
        copyrightHref={copyrightHref}
      />
    </main>
  )
}
