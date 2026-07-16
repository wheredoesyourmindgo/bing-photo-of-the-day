import type {Metadata} from 'next'
import {getPhotoOfTheDay} from '@/lib/bing'
import {Playground} from './playground'

export const metadata: Metadata = {
  title: 'Playground · Bing Image of the Day',
  description:
    'Interactively configure the copyright caption and copy the URL to use.'
}

export default async function PlaygroundPage() {
  const {imageUrl, copyright, copyrightHref, title} = await getPhotoOfTheDay()

  return (
    <Playground
      imageUrl={imageUrl}
      title={title}
      copyright={copyright}
      copyrightHref={copyrightHref}
    />
  )
}
