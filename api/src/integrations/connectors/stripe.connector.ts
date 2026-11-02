export async function testStripe(
  key: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // @ts-ignore — stripe v22 exports are resolved at runtime by Node
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key) as any;
    await stripe.accounts.retrieve(''); // empty string = retrieve own account
    return { success: true, message: 'Stripe connection successful' };
  } catch (err: any) {
    const message: string = err?.message ?? 'Stripe connection failed';
    return { success: false, message };
  }
}
