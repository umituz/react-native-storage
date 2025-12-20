/**
 * AsyncStorage Mock
 *
 * Mock implementation for testing
 */

export class AsyncStorageMock {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getAllKeys(): Promise<readonly string[]> {
    return Array.from(this.storage.keys());
  }

  async multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]> {
    return keys.map(key => [key, this.storage.get(key) || null]);
  }

  // Test utilities
  __clear() {
    this.storage.clear();
  }

  __size() {
    return this.storage.size;
  }

  __has(key: string) {
    return this.storage.has(key);
  }

  __get(key: string) {
    return this.storage.get(key);
  }
}

export const AsyncStorage = new AsyncStorageMock();