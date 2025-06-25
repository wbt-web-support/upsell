import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { customerId, amount, productName, step } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get the customer's saved payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'No saved payment method found' },
        { status: 400 }
      );
    }

    // Use the first (most recent) payment method
    const paymentMethod = paymentMethods.data[0];

    // Create payment intent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.id,
      confirmation_method: 'automatic',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success.html`,
      metadata: {
        step: step.toString(),
        flow: 'upsell',
        product_name: productName
      }
    });

    return NextResponse.json({ 
      success: true, 
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      }
    });
  } catch (error) {
    console.error('Error processing upsell payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment: ' + (error as any).message },
      { status: 500 }
    );
  }
} 