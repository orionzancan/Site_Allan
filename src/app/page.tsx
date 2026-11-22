import Link from 'next/link';
import { getDatabaseEngine, getProducts, getSettings, getStores } from '@/lib/db/repository';
import { StorefrontClient } from '@/components/StorefrontClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, products, stores] = await Promise.all([
    getSettings(),
    getProducts(false),
    getStores(false)
  ]);
  const dbEngine = getDatabaseEngine();

  if (settings.maintenance_mode) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="card-surface max-w-lg w-full p-8 text-center border-brand/50">
          <p className="font-display text-4xl tracking-wider text-brand uppercase">{settings.brand_name}</p>
          <p className="font-serif italic text-red-400 mt-1">{settings.slogan}</p>
          <h1 className="text-xl font-bold mt-6">Loja em manutenção programada</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Estamos atualizando nosso estoque e ofertas. Voltamos em instantes!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="btn-brand"
            >
              Falar no WhatsApp
            </a>
            <Link href="/admin" className="btn-outline-dark">
              Acesso Admin
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <StorefrontClient
      initialSettings={settings}
      initialProducts={products}
      initialStores={stores}
      dbEngine={dbEngine}
    />
  );
}
