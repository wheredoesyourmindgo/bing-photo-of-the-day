/**
 * Data access for Bing's "Image of the Day" HPImageArchive endpoint.
 *
 * The types here describe only the slice of Bing's (undocumented) response
 * that we actually consume, and live next to the one module that uses them —
 * see this project's convention note in tsconfig.json.
 */

const ENDPOINT = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
const IMAGE_BASE_URL = 'https://www.bing.com'

/**
 * How long a fetched photo stays in Next's Data Cache before it's re-checked.
 *
 * This short window — not the daily cron — is what keeps us fresh: nobody knows
 * exactly when Bing rolls the photo over, so instead of guessing that time we
 * just re-poll every 15 minutes. Rollover-time- and timezone-agnostic, which is
 * what we want for a US-wide audience. Worst-case staleness is one window.
 */
export const REVALIDATE_SECONDS = 900 // 15 minutes

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

/** Fetch today's Bing photo, served from the Data Cache between refreshes. */
export async function getPhotoOfTheDay(): Promise<PhotoOfTheDay> {
  const res = await fetch(ENDPOINT, {
    next: {revalidate: REVALIDATE_SECONDS}
  })

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
