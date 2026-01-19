import {Analytics} from '@vercel/analytics/next'
import {Inter} from 'next/font/google'
import './globals.css'

export const metadata = {
  title: 'Bing Photo of the Day',
  description: 'A sample Next.js app to display the Bing Photo of the Day'
}

const sansFont = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap' // or 'optional' to reduce visible swapping
})

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${sansFont.variable}  font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
