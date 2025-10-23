import {Analytics} from '@vercel/analytics/next'
import './globals.css'

export const metadata = {
  title: 'Bing Photo of the Day',
  description: 'A sample Next.js app to display the Bing Photo of the Day'
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
