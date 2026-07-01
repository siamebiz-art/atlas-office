import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { userId, email } = await req.json()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO!, quantity: 1 }],
    customer_email: email,
    metadata: { userId },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/workspace/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/workspace/settings`,
  })
  return NextResponse.json({ url: session.url })
}
