const CONTENT: Record<string, { title: string; body: string[] }> = {
  about: { title: 'About ShopSphere', body: ['ShopSphere is a fictional online retailer created as a realistic, hands-on environment for learning web application security.', 'Everything here — products, customers, orders, and payments — is synthetic. No real goods are sold and no real money changes hands.'] },
  contact: { title: 'Contact us', body: ['Questions about an order? Open a support ticket from your account.', 'This is a training environment; messages are stored locally and never sent anywhere.'] },
  help: { title: 'Help Center', body: ['Browse FAQs, shipping and returns information, or open a support ticket from your account dashboard.'] },
  faq: { title: 'Frequently asked questions', body: ['Is this a real store? No — ShopSphere is a synthetic training application.', 'Are payments real? No. All payments are simulated.', 'Can I use real personal data? Please do not. Use only the synthetic accounts provided.'] },
  shipping: { title: 'Shipping', body: ['Standard delivery is free on orders over $75, otherwise $6.99.', 'Estimated delivery is 3–5 business days (simulated).'] },
  returns: { title: 'Returns & refunds', body: ['Unopened items may be returned within 30 days.', 'Refunds are simulated and reflected in your order history.'] },
  privacy: { title: 'Privacy policy', body: ['This training environment uses only synthetic data. Do not enter real personal information.', 'Session tokens are stored in your browser to keep you signed in.'] },
  terms: { title: 'Terms of service', body: ['ShopSphere is provided for educational use within an authorized training program.', 'See the Responsible Use policy in the project documentation.'] },
};
export default function Content({ slug }: { slug: string }) {
  const c = CONTENT[slug] ?? { title: 'Page', body: [] };
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{c.title}</h1>
      <div className="prose mt-6 space-y-4 text-ink-soft">{c.body.map((p, i) => <p key={i}>{p}</p>)}</div>
    </div>
  );
}
