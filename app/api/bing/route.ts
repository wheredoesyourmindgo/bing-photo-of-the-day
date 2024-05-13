// app/api/bing/route.ts

import {  NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
    const data = await response.json();
    const imageUrl = `https://www.bing.com${data.images[0].url}`;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching Bing Photo of the Day' }, { status: 500 });
  }
}
