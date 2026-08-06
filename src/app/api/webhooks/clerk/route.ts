import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Keeps the Postgres `User` table in sync with Clerk (source of truth for
 * auth). New users are also lazily created on first sign-in via
 * `getCurrentDbUser`, but updates/deletions made from the Clerk dashboard
 * only reach us through this webhook.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const webhook = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses.find((e) => e.id === event.data.primary_email_address_id)?.email_address;
      if (!email) break;

      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          imageUrl: image_url,
        },
        update: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          imageUrl: image_url,
        },
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
