// app/page.tsx
import Image from "next/image";

export default async function Home() {
  const data = await getData();
  const { imageUrl } = data;

  return (
    <div>
      <Image
        layout="fill"
        objectFit="cover"
        quality={100}
        src={imageUrl}
        alt="Bing Photo of the Day"
      />
    </div>
  );
}

async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/bing`);

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
