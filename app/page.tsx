// app/page.tsx
import Image from "next/image";

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/bing`, {
    // allow cache for 5 hours
    next: { revalidate: 60 * 60 * 5 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
