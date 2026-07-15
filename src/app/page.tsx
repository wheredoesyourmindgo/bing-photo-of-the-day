import Image from 'next/image'
import {getPhotoOfTheDay} from '@/lib/bing'

// ISR window for the route. Passed into the fetch below so the cached upstream
// response and the page share one refresh cadence (15 minutes). The daily cron
// at /api/revalidate forces an earlier refresh when Bing publishes a new photo.
export const revalidate = 900

type HomeProps = {
  searchParams?: Promise<{
    copyright?: string
  }>
}

export default async function Home({searchParams}: HomeProps) {
  const [{imageUrl, copyright, copyrightHref, title}, params] =
    await Promise.all([getPhotoOfTheDay(revalidate), searchParams])

  const showCopyright = params?.copyright?.toLowerCase() === 'true'

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

      {showCopyright && copyright && copyrightHref && (
        <a
          href={copyrightHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 bottom-2 z-10 rounded bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/70"
        >
          {copyright}
        </a>
      )}
    </main>
  )
}
