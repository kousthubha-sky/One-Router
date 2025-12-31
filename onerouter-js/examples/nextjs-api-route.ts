import { NextResponse } from 'next/server';
import { OneRouter } from '@onerouter/sdk';

const client = new OneRouter({ apiKey: process.env.ONEROUTER_API_KEY || 'unf_live_xxx' });

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { amount, currency, receipt } = body;

  const order = await client.payments.create({
    amount,
    currency: currency || 'INR',
    receipt
  });

  return NextResponse.json(order);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const transactionId = searchParams.get('id');

  if (!transactionId) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  const details = await client.payments.get(transactionId);

  return NextResponse.json(details);
}