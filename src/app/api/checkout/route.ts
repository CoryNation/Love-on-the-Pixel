import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    // Check if this is a one-time payment or subscription
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === 'one_time' ? 'payment' : 'subscription';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/me?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/me?canceled=true`,
      automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}

