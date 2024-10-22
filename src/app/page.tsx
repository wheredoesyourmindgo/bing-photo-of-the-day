import Image from "next/image";

export interface BingImageArchiveResponse {
  images: Image[];
  tooltips: Tooltips;
}

export interface Image {
  startdate: string;
  fullstartdate: string;
  enddate: string;
  url: string;
  urlbase: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  quiz: string;
  wp: boolean;
  hsh: string;
  drk: number;
  top: number;
  bot: number;
  hs: any[];
}

export interface Tooltips {
  loading: string;
  previous: string;
  next: string;
  walle: string;
  walls: string;
}

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

  const res = await fetch<BingImageArchiveResponse>(
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1",
    // this opts out of caching too
    // { cache: "no-store" }
    {
      // unclear if setting cache control headers helps in regards to caching
      // headers: {
      //   "Cache-Control": `s-maxage=0, stale-while-revalidate=${60 * 60 * 5}`,
      // },
      // allow cache for 5 hours
      next: { revalidate: 60 * 60 * 5 }, // 5 hours
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const data = await res.json();
  const [todaysImg] = data.images;
  const imageUrl = `https://www.bing.com${todaysImg.url}`;
  return { imageUrl };
}
