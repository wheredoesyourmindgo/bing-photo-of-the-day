import {Analytics} from '@vercel/analytics/next'
import {Manrope, Inter} from 'next/font/google'
import {cn} from '@/lib/utils'
import {TooltipProvider} from '@/components/ui/tooltip'
import './globals.css'

export const metadata = {
  title: 'Bing Photo of the Day',
  description: 'Display the Bing Photo of the Day'
}

const sansFont = Manrope({
  variable: '--font-sans',
  subsets: ['latin']
})

const captionFont = Inter({
  variable: '--font-caption',
  subsets: ['latin']
})

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={cn('font-sans', sansFont.variable, captionFont.variable)}
    >
      <body className="antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  )
}
