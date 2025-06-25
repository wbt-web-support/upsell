import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'gbp', metadata = {}, customerInfo, customer } = body;

    console.log('Creating payment intent with:', { amount, currency, metadata, customerInfo, customer });

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than £0. Free products should be handled separately.' },
        { status: 400 }
      );
    }

    let customerId = customer; // Use direct customer ID if provided
    
    // Create or find customer if customer info is provided (for new customers)
    if (!customerId && customerInfo && customerInfo.email) {
      try {
        // First, try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: customerInfo.email,
          limit: 1,
        });
        
        if (existingCustomers.data.length > 0) {
          // Use existing customer
          customerId = existingCustomers.data[0].id;
          console.log('Using existing customer:', customerId);
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: customerInfo.email,
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            phone: customerInfo.phone,
            metadata: {
              first_name: customerInfo.firstName,
              last_name: customerInfo.lastName,
            }
          });
          customerId = customer.id;
          console.log('Created new customer:', customerId);
        }
      } catch (customerError) {
        console.error('Error handling customer:', customerError);
        // Continue without customer if there's an error
      }
    }

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      setup_future_usage: 'off_session', // Save payment method for future use
      metadata: metadata,
    };

    // Add customer if created
    if (customerId) {
      paymentIntentData.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('Payment intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to create payment intent: ' + errorMessage },
      { status: 500 }
    );
  }
} 