import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createServerClient()

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (userId) {
      await supabase.from("profiles").update({ plan: "pro" }).eq("id", userId)
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.userId
    if (userId) {
      await supabase.from("profiles").update({ plan: "free" }).eq("id", userId)
    }
  }

  return NextResponse.json({ received: true })
}
