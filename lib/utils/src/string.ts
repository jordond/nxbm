export function underscoreToCamel(str: string): string {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
}
