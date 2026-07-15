import Image from 'next/image'
import {Caption} from '@/components/caption'
import {parseCaptionParams, type CaptionParams} from '@/lib/caption'
import {getPhotoOfTheDay} from '@/lib/bing'

type HomeProps = {
  searchParams?: Promise<CaptionParams>
}

export default async function Home({searchParams}: HomeProps) {
  const [{imageUrl, copyright, copyrightHref, title}, params] =
    await Promise.all([getPhotoOfTheDay(), searchParams])

  const config = parseCaptionParams(params)

  return (
    <main className="relative h-screen w-screen">
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
    </main>
  )
}
