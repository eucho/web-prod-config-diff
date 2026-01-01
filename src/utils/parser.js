/**
 * Resolve variable references in text
 * Replaces $Base$KeyName$ with the value of KeyName from parsed data
 */
function resolveVariables(text, parsedData) {
  // Match pattern: $Base$KeyName$
  const variablePattern = /\$Base\$([^$]+)\$/g;

  return text.replace(variablePattern, (match, keyName) => {
    // If the key exists in parsed data, replace with its value
    // Otherwise, keep the original text
    return parsedData[keyName] !== undefined ? parsedData[keyName] : match;
  });
}

/**
 * Parse multi-line text to extract keys and their config values
 * Expected format: Key_1=[config_1][config_2]...[config_n]
 * Supports variable references: $Base$KeyName$ will be replaced with the value of KeyName
 */
export function parseText(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const parsed = {};

  // First pass: parse all key-value pairs
  lines.forEach(line => {
    const match = line.match(/^(.+?)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      parsed[key] = value;
    }
  });

  // Second pass: resolve variable references in values
  Object.keys(parsed).forEach(key => {
    parsed[key] = resolveVariables(parsed[key], parsed);
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
