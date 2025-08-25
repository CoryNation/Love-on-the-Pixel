export interface AffirmationTheme {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const AFFIRMATION_THEMES: AffirmationTheme[] = [
  {
    id: 'love',
    name: 'Love',
    emoji: '💕',
    color: '#ff6b9d',
    description: 'Expressions of deep love and affection'
  },
  {
    id: 'adoration',
    name: 'Adoration',
    emoji: '💖',
    color: '#ff8a80',
    description: 'Worshipful admiration and devotion'
  },
  {
    id: 'affirmation',
    name: 'Affirmation',
    emoji: '💪',
    color: '#4ecdc4',
    description: 'Supportive and encouraging messages'
  },
  {
    id: 'thanks',
    name: 'Thanks',
    emoji: '🙏',
    color: '#96ceb4',
    description: 'Gratitude and appreciation'
  },
  {
    id: 'flirt',
    name: 'Flirt',
    emoji: '😘',
    color: '#ffb3ba',
    description: 'Playful and romantic messages'
  },
  {
    id: 'appreciation',
    name: 'Appreciation',
    emoji: '💖',
    color: '#45b7d1',
    description: 'Recognition of value and worth'
  },
  {
    id: 'unhinged',
    name: 'Unhinged',
    emoji: '🤪',
    color: '#ff9ff3',
    description: 'Funny, random, and ridiculous notes'
  }
];

export const getThemeById = (id: string): AffirmationTheme | undefined => {
  return AFFIRMATION_THEMES.find(theme => theme.id === id);
};

export const getThemeColor = (themeId: string): string => {
  const theme = getThemeById(themeId);
  return theme?.color || '#96ceb4'; // Default color
};

export const getThemeEmoji = (themeId: string): string => {
  const theme = getThemeById(themeId);
  return theme?.emoji || '💖'; // Default emoji
};
