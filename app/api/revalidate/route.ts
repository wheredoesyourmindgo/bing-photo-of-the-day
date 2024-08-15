// app/api/revalidate/route.js

import { revalidatePath } from "next/cache";

export async function POST() {
  try {
    revalidatePath("/");
    return new Response("Revalidation triggered", { status: 200 });
  } catch (error) {
    return new Response("Failed to revalidate", { status: 500 });
  }
}
