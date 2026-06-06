import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OfflineCacheService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }
}
