import Image from "next/image";
// this doesn't opt of caching as far as I can tell
// export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getData();
  const { imageUrl } = data;

  return (
    <div>
      <Image
        fill
        quality={100}
        src={imageUrl}
        alt="Bing Photo of the Day"
        priority
        style={{
          objectFit: "cover",
        }}
      />
    </div>
  );
}

async function getData() {
  // this opts out of caching
  // unstable_noStore();

  const res = await fetch(
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1",
    // this opts out of caching too
    // { cache: "no-store" }
    // allow cache for 5 hours
    {
      next: { revalidate: 60 * 60 * 5 },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const data = await res.json();
  const imageUrl = `https://www.bing.com${data.images[0].url}`;
  return { imageUrl };
}
