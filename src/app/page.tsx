import Image from 'next/image'
import type {BingImageArchiveResponse} from 'src/types/bing'

export const revalidate = 900 // 15 minutes

type HomeProps = {
  searchParams?: Promise<{
    copyright?: string
  }>
}

export default async function Home({searchParams}: HomeProps) {
  const data = await getData()
  const params = await searchParams

  const {imageUrl, copyright, copyrightlink: copyrightHref} = data

  const showCopyright = params?.copyright?.toLowerCase() === 'true'

  return (
    <div className="relative h-screen w-screen">
      <Image
        fill
        quality={100}
        src={imageUrl}
        alt="Bing Photo of the Day"
        priority
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
    </div>
  )
}

async function getData() {
  const res = await fetch<BingImageArchiveResponse>(
    'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1',
    {next: {revalidate}}
  )

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  const data = await res.json()
  const [todaysImg] = data.images
  const imageUrl = `https://www.bing.com${todaysImg.url}`
  return {
    imageUrl,
    copyright: todaysImg.copyright,
    copyrightlink: todaysImg.copyrightlink
  }
}
