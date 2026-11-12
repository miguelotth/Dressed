import { CATEGORY_LABELS, type Category, type ClothingItem, type Occasion } from '../types';
export const newId = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'você';
export const initials = (name: string) => name.trim().split(/\s+/).slice(0,2).map(p=>p.charAt(0)).join('').toUpperCase() || 'LL';
export const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value));
export const isNeutral = (item: ClothingItem) => ['Preto','Branco','Bege','Marrom'].includes(item.color);
export const occasionScore = (item: ClothingItem, occasion: Occasion) => item.occasion === occasion ? 5 : item.occasion === 'Casual' ? 2 : 1;
export const describeItems = (items: ClothingItem[]) => items.map(item => `${item.name} (${CATEGORY_LABELS[item.category]})`).join(', ');
export const toSlot = (cat: Category) => cat;
export const readImageFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
    reject(new Error('Use uma imagem JPG, PNG ou WEBP.')); return;
  }
  if (file.size > 4 * 1024 * 1024) {
    reject(new Error('A imagem deve ter no máximo 4 MB.')); return;
  }
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas não disponível neste navegador.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      // WEBP keeps transparency and reduces the space used in browser storage.
      resolve(canvas.toDataURL('image/webp', 0.76));
    } catch (error) { reject(error); }
    finally { URL.revokeObjectURL(url); }
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler esta imagem.')); };
  image.src = url;
});
