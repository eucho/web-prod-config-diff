/**
 * Parse multi-line text to extract keys and their config values
 * Expected format: Key_1=[config_1][config_2]...[config_n]
 */
export function parseText(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const parsed = {};

  lines.forEach(line => {
    const match = line.match(/^(.+?)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      parsed[key] = value;
    }
  });

  return parsed;
}

/**
 * Get all keys from parsed text
 */
export function getKeys(parsedText) {
  return Object.keys(parsedText);
}

/**
 * Get config value for a specific key
 */
export function getConfigValue(parsedText, key) {
  return parsedText[key] || '';
}
