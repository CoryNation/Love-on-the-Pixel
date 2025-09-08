import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    console.log('Checkout API called');
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    console.log('Stripe secret key found, initializing Stripe...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    const { priceId, productName, productEmoji } = await req.json();
    console.log('Request data:', { priceId, productName, productEmoji });

    if (!priceId) {
      console.error('No price ID provided');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if this is a one-time payment or subscription
    console.log('Retrieving price from Stripe...');
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === 'one_time' ? 'payment' : 'subscription';
    console.log('Price retrieved:', { type: price.type, mode });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Base URL:', baseUrl);

    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/me?success=true&product=${encodeURIComponent(productName || 'Support')}`,
      cancel_url: `${baseUrl}/me?canceled=true`,
      // Disable automatic tax calculation to avoid origin address requirement
      // automatic_tax: { enabled: true },
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

    console.log('Checkout session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe checkout error:', e);
    console.error('Error details:', {
      message: e.message,
      type: e.type,
      code: e.code,
      statusCode: e.statusCode
    });
    return NextResponse.json({ 
      error: `Unable to create checkout session: ${e.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

