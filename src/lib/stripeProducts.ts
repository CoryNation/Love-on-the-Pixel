export interface StripeProduct {
  id: string;
  name: string;
  emoji: string;
  description: string;
  oneTimePriceId: string;
  recurringPriceId?: string; // Optional for products that don't support recurring
  suggestedAmount?: number; // For display purposes
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'diamond',
    name: 'Diamond ($100)',
    emoji: '💎',
    description: 'Fund a special moment that sparkles',
    oneTimePriceId: 'price_1S41ifFlJjtVeFmbIDfguZJ2',
    recurringPriceId: 'price_1S41iQFlJjtVeFmbcQ7f4a72',
    suggestedAmount: 100
  },
  {
    id: 'dinner',
    name: 'Dinner ($50)',
    emoji: '🍽️',
    description: 'Treat us to a romantic dinner',
    oneTimePriceId: 'price_1S41iDFlJjtVeFmbLJJUU3Se',
    recurringPriceId: 'price_1S41hyFlJjtVeFmbbdTpIYIE',
    suggestedAmount: 50
  },
  {
    id: 'wine',
    name: 'Wine ($30)',
    emoji: '🍷',
    description: 'Fund a wine tasting experience',
    oneTimePriceId: 'price_1S41hlFlJjtVeFmbGD06Vk7g',
    recurringPriceId: 'price_1S41hXFlJjtVeFmb6bYpc5fl',
    suggestedAmount: 30
  },
  {
    id: 'coffee',
    name: 'Coffee ($15)',
    emoji: '☕',
    description: 'Buy us a cozy coffee date',
    oneTimePriceId: 'price_1S41hLFlJjtVeFmbmUytPJM0',
    recurringPriceId: 'price_1S41h7FlJjtVeFmbOUaCG6Xo',
    suggestedAmount: 15
  },
  {
    id: 'heart',
    name: 'Heart ($25)',
    emoji: '❤️',
    description: 'Support our love story',
    oneTimePriceId: 'price_1S41gtFlJjtVeFmbSV9SyEVN',
    recurringPriceId: 'price_1S41gfFlJjtVeFmbq4ZVrCYW',
    suggestedAmount: 25
  },
  {
    id: 'custom-gift',
    name: 'Custom Gift',
    emoji: '🎁',
    description: 'Send us a custom surprise',
    oneTimePriceId: 'price_1S4tE1FlJjtVeFmbfP80hPwa',
    recurringPriceId: undefined, // No recurring option for custom gift
    suggestedAmount: 0
  }
];

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}

export function getPriceId(productId: string, isRecurring: boolean): string | undefined {
  const product = getProductById(productId);
  if (!product) return undefined;
  
  if (isRecurring) {
    return product.recurringPriceId || undefined;
  } else {
    return product.oneTimePriceId;
  }
}
