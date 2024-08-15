import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return new Response("Unauthorized", { status: 401 });
    }

    revalidatePath("/");
    return new Response("Revalidation triggered", { status: 200 });
  } catch (error) {
    console.error("Revalidation error:", error);
    return new Response("Failed to revalidate", { status: 500 });
  }
}
