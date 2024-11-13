import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function GET(_req: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("Authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return new Response("Unauthorized", { status: 401 });
    }

    revalidatePath("/", "page");
    return new Response("Revalidation triggered", { status: 200 });
  } catch (error) {
    console.error("Revalidation error:", error);
    return new Response("Failed to revalidate", { status: 500 });
  }
}
