import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    const { priceId, productName, productEmoji } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if this is a one-time payment or subscription
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === 'one_time' ? 'payment' : 'subscription';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/me?success=true&product=${encodeURIComponent(productName || 'Support')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/me?canceled=true`,
      automatic_tax: { enabled: true },
      metadata: {
        product_name: productName || 'Support',
        product_emoji: productEmoji || '❤️',
        product_id: priceId
      },
      custom_text: {
        submit: {
          message: productName ? `Thank you for supporting our ${productName.toLowerCase()} experience! 💕` : 'Thank you for your support! 💕'
        }
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe checkout error:', e);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}

