// app/api/revalidate/route.js

import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    if (
      req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }
    revalidatePath("/");
    return new Response("Revalidation triggered", { status: 200 });
  } catch (error) {
    return new Response("Failed to revalidate", { status: 500 });
  }
}
