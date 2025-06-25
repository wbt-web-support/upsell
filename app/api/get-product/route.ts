import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product details
    const product = await stripe.products.retrieve(productId);
    
    // Fetch prices for this product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'No active prices found for this product' },
        { status: 404 }
      );
    }

    // Get the first active price (you can modify this logic as needed)
    const price = prices.data[0];

    // Format price with appropriate currency symbol
    const currencySymbol = price.currency === 'gbp' ? '£' : '$';
    const formattedPrice = `${currencySymbol}${(price.unit_amount! / 100).toFixed(2)}`;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
      },
      price: {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        formatted: formattedPrice,
        raw_formatted: (price.unit_amount! / 100).toFixed(2),
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
} 