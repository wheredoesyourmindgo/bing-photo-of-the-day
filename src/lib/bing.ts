/**
 * Data access for Bing's "Image of the Day" HPImageArchive endpoint.
 *
 * The types here describe only the slice of Bing's (undocumented) response
 * that we actually consume, and live next to the one module that uses them —
 * see this project's convention note in tsconfig.json.
 */

const ENDPOINT = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
const IMAGE_BASE_URL = 'https://www.bing.com'

/** A single entry in the Bing image archive response. */
interface BingImage {
  /** Path to the image, relative to {@link IMAGE_BASE_URL}. */
  url: string
  /** Human-readable caption, e.g. the location shown. */
  copyright: string
  /** URL for the "learn more" search behind the caption. */
  copyrightlink: string
  title: string
}

interface BingImageArchiveResponse {
  images: BingImage[]
}

/** The normalized shape the UI renders. */
export interface PhotoOfTheDay {
  imageUrl: string
  copyright: string
  copyrightHref: string
  title: string
}

/**
 * Fetch today's Bing photo.
 *
 * @param revalidateSeconds How long the upstream response stays in Next's Data
 *   Cache. Kept in sync with the page's `revalidate` export by passing it in.
 */
export async function getPhotoOfTheDay(
  revalidateSeconds: number
): Promise<PhotoOfTheDay> {
  const res = await fetch(ENDPOINT, {next: {revalidate: revalidateSeconds}})

  if (!res.ok) {
    throw new Error(`Failed to fetch Bing image archive: ${res.status}`)
  }

  const data = (await res.json()) as BingImageArchiveResponse
  const [today] = data.images

  if (!today) {
    throw new Error('Bing image archive returned no images')
  }

  return {
    imageUrl: `${IMAGE_BASE_URL}${today.url}`,
    copyright: today.copyright,
    copyrightHref: today.copyrightlink,
    title: today.title
  }
}
