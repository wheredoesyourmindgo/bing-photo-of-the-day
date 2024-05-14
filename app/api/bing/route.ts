// app/api/bing/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1"
    );
    const data = await response.json();
    const imageUrl = `https://www.bing.com${data.images[0].url}`;
    return Response.json({ imageUrl });
  } catch (error) {
    return Response.json(
      { error: "Error fetching Bing Photo of the Day" },
      { status: 500 }
    );
  }
}
