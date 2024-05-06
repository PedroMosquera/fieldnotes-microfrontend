export const themes = {
  forest: { accent: '#244b3f', hover: '#17382e', surface: '#ffffff', text: '#202b29', muted: '#64706b', soft: '#edf3ef' },
  ocean: { accent: '#24577a', hover: '#153b58', surface: '#ffffff', text: '#1d3040', muted: '#526b7a', soft: '#eaf3fa' },
  plum: { accent: '#65375f', hover: '#492445', surface: '#ffffff', text: '#362235', muted: '#73596c', soft: '#f5edf4' },
};

export function resolveTokens(preferences) {
  const colors = themes[preferences?.theme] || themes.forest;
  const compact = preferences?.density === 'compact';
  return { ...colors, gap: compact ? '12px' : '20px', control: compact ? '7px 10px' : '10px 14px', radius: compact ? '4px' : '8px' };
}

export function applyTokens(element, preferences) {
  for (const [name, value] of Object.entries(resolveTokens(preferences))) element.style.setProperty(`--shop-${name}`, value);
  element.dataset.theme = preferences?.theme || 'forest';
  element.dataset.density = preferences?.density || 'comfortable';
}

