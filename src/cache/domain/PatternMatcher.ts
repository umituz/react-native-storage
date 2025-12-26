/**
 * Pattern Matcher for Cache Keys
 */

const regexCache = new Map<string, RegExp>();

export class PatternMatcher {
  static convertPatternToRegex(pattern: string): RegExp {
    if (regexCache.has(pattern)) {
      return regexCache.get(pattern)!;
    }

    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${escapedPattern}$`);
    
    regexCache.set(pattern, regex);
    return regex;
  }

  static matchesPattern(key: string, pattern: string): boolean {
    const regex = this.convertPatternToRegex(pattern);
    return regex.test(key);
  }

  static clearCache(): void {
    regexCache.clear();
  }
}