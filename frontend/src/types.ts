export type Category = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'bags' | 'accessories';
export type Season = 'Todas' | 'Verão' | 'Outono' | 'Inverno' | 'Primavera';
export type Occasion = 'Casual' | 'Trabalho' | 'Faculdade' | 'Festa' | 'Passeio' | 'Especial';
export type Accent = 'berry' | 'lilac' | 'rose';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  hex: string;
  season: Season;
  occasion: Occasion;
  style: string;
  image?: string;
  favorite: boolean;
  createdAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  occasion: Occasion;
  notes: string;
  favorite: boolean;
  createdAt: string;
}

export interface Profile {
  name: string;
  email: string;
  wardrobeName: string;
  accent: Accent;
  dailyInspiration: boolean;
  stylingTips: boolean;
  emailUpdates: boolean;
  avatar?: string;
}

export interface StoreState {
  clothes: ClothingItem[];
  outfits: Outfit[];
  profile: Profile;
  demo: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: 'Partes de cima', bottoms: 'Partes de baixo', dresses: 'Vestidos',
  outerwear: 'Terceiras peças', shoes: 'Calçados', bags: 'Bolsas', accessories: 'Acessórios',
};
export const CATEGORY_SHORT: Record<Category, string> = {
  tops: 'Tops', bottoms: 'Bottoms', dresses: 'Vestidos', outerwear: 'Casacos',
  shoes: 'Calçados', bags: 'Bolsas', accessories: 'Acessórios',
};
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
export const OCCASIONS: Occasion[] = ['Casual', 'Faculdade', 'Trabalho', 'Passeio', 'Festa', 'Especial'];
export const SEASONS: Season[] = ['Todas', 'Verão', 'Outono', 'Inverno', 'Primavera'];
export const COLORS = [
  { label: 'Preto', hex: '#33313A' }, { label: 'Branco', hex: '#F2EDEB' },
  { label: 'Bege', hex: '#C8B8A2' }, { label: 'Rosa', hex: '#E8A7BE' },
  { label: 'Lilás', hex: '#B5A1DA' }, { label: 'Azul', hex: '#779DC4' },
  { label: 'Verde', hex: '#879D84' }, { label: 'Marrom', hex: '#936F5C' },
  { label: 'Vermelho', hex: '#BC6067' }, { label: 'Amarelo', hex: '#E7CC7A' },
];
