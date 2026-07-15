import {revalidatePath} from 'next/cache'
import {headers} from 'next/headers'

// Daily backstop only. The 15-minute Data Cache window on the Bing fetch is
// what actually keeps the photo current (rollover- and timezone-agnostic);
// this cron just guarantees at least one fresh pull per day so a first visitor
// after a long idle gap never gets served a day-old photo. Because the fetch
// window self-heals, the exact cron time doesn't need to match Bing's rollover.
export async function GET(_req: Request) {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('Authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      return new Response('Unauthorized', {status: 401})
    }

    revalidatePath('/', 'page')
    return new Response('Revalidation triggered', {status: 200})
  } catch (error) {
    console.error('Revalidation error:', error)
    return new Response('Failed to revalidate', {status: 500})
  }
}
