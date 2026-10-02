import React from 'react';
import { Product } from '../../types';
import { Plus, Coffee } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const isOutOfStock = product.track_inventory && (product.current_stock ?? 0) <= 0;
  const isLowStock =
    product.track_inventory &&
    (product.current_stock ?? 0) > 0 &&
    (product.current_stock ?? 0) <= (product.min_stock_alert ?? 10);

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onAdd(product);
      }}
      className={`group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all select-none cursor-pointer ${
        isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'
      }`}
    >
      {/* Product Image */}
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback image if broken
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80';
          }}
        />
        {/* Stock warning or out of stock indicator */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
            Habis
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            Sisa {product.current_stock}
          </div>
        ) : null}
      </div>

      {/* Product Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed metadata: SKU */}
          <div className="text-[10px] font-mono font-medium text-slate-400 mb-0.5 truncate">
            {product.sku}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
            {product.name}
          </h4>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-black text-blue-950">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          <button
            type="button"
            disabled={isOutOfStock}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
