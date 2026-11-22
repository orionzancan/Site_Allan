'use client';

import { Calculator, Home, MapPin, Package, ShoppingCart } from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
}

export function MobileBottomNav({ cartCount, onOpenCart }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navegação Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-white/15 bg-[#09090b]/95 px-1 py-2 backdrop-blur-md md:hidden"
    >
      <a href="#topo" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-zinc-300 hover:text-brand">
        <Home className="h-5 w-5" />
        <span>Início</span>
      </a>
      <a href="#calculadora" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-zinc-300 hover:text-brand">
        <Calculator className="h-5 w-5" />
        <span>Cotar m²</span>
      </a>
      <a href="#catalogo" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-zinc-300 hover:text-brand">
        <Package className="h-5 w-5" />
        <span>Catálogo</span>
      </a>
      <a href="#retirada" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-zinc-300 hover:text-brand">
        <MapPin className="h-5 w-5" />
        <span>Lojas</span>
      </a>
      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex flex-col items-center gap-0.5 text-[11px] font-semibold text-brand"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Carrinho</span>
        {cartCount > 0 && (
          <span className="absolute right-3 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {cartCount}
          </span>
        )}
      </button>
    </nav>
  );
}
