import React from 'react';
import { Category } from '../../types';
import {
  Sparkles,
  Coffee,
  Flame,
  CupSoda,
  Cake,
  Cookie,
  Utensils,
  Layers,
} from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'sparkles':
        return Sparkles;
      case 'coffee':
        return Coffee;
      case 'flame':
        return Flame;
      case 'cupsoda':
        return CupSoda;
      case 'cake':
        return Cake;
      case 'cookie':
        return Cookie;
      default:
        return Utensils;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
      {/* "Semua Menu" tab */}
      <button
        onClick={() => onSelectCategory('ALL')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
          selectedCategoryId === 'ALL'
            ? 'bg-blue-900 text-white shadow-xs'
            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Semua Menu</span>
      </button>

      {/* Dynamic categories */}
      {categories.map((cat) => {
        const Icon = getIcon(cat.icon);
        const isActive = selectedCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
              isActive
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-900'}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};
