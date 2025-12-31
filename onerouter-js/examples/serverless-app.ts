import { OneRouter } from '@onerouter/sdk';

const client = new OneRouter({ apiKey: process.env.ONEROUTER_API_KEY || 'unf_live_xxx' });

export async function handlePayment(request: Request) {
  const { amount, currency } = await request.json();
  const order = await client.payments.create({
    amount,
    currency: currency || 'INR'
  });

  return Response.json(order);
}