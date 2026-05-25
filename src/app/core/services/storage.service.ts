import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PREFIX = 'taskflow:';

  /**
   * Reads a value from LocalStorage.
   * Returns `defaultValue` if the key is missing or the stored JSON is corrupt.
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Serialises `value` to JSON and writes it to LocalStorage.
   * Silently swallows storage errors (e.g. private-mode quota exceeded).
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch {
      console.error(`StorageService: failed to write "${this.PREFIX + key}"`);
    }
  }

  /** Removes a single key. */
  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /** Removes every key that starts with the 'taskflow:' prefix. */
  clear(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }
}
