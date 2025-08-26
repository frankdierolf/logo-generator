import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { encodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";
import type { CachedLogo, LogoResult } from "../core/types.ts";

export class CacheManager {
  private memoryCache = new Map<string, CachedLogo>();
  private cacheDir: string;
  private ttl: number;
  private maxSize: number;

  constructor(
    cacheDir: string = "./cache",
    ttlSeconds: number = 3600,
    maxSizeMB: number = 500,
  ) {
    this.cacheDir = cacheDir;
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  }

  async get(promptHash: string): Promise<CachedLogo | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(promptHash);
    if (memCached && !this.isExpired(memCached)) {
      return { ...memCached, hit: true };
    }

    // Check file cache
    const fileCached = await this.getFromFile(promptHash);
    if (fileCached && !this.isExpired(fileCached)) {
      // Store in memory for faster access
      this.memoryCache.set(promptHash, fileCached);
      return { ...fileCached, hit: true };
    }

    return null;
  }

  async set(promptHash: string, result: LogoResult): Promise<void> {
    const cached: CachedLogo = {
      ...result,
      expiresAt: Date.now() + this.ttl,
      hit: false,
    };

    // Store in memory
    this.memoryCache.set(promptHash, cached);

    // Store in file cache
    await this.saveToFile(promptHash, cached);

    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      await this.cleanup();
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();

    try {
      if (await exists(this.cacheDir)) {
        for await (const entry of Deno.readDir(this.cacheDir)) {
          if (entry.isFile && entry.name.endsWith(".json")) {
            await Deno.remove(join(this.cacheDir, entry.name));
          }
        }
      }
      console.log("✅ Cache cleared");
    } catch (error) {
      console.warn(
        `Warning: Failed to clear file cache: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getStats(): Promise<CacheStats> {
    const memoryEntries = this.memoryCache.size;
    let fileEntries = 0;
    let totalSize = 0;

    try {
      if (await exists(this.cacheDir)) {
        for await (const entry of Deno.readDir(this.cacheDir)) {
          if (entry.isFile && entry.name.endsWith(".json")) {
            fileEntries++;
            const stat = await Deno.stat(join(this.cacheDir, entry.name));
            totalSize += stat.size;
          }
        }
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to get cache stats: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      memoryEntries,
      fileEntries,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
    };
  }

  createPromptHash(
    company: string,
    prompt: string,
    style?: string,
    colors?: string[],
  ): string {
    const input = `${company}:${prompt}:${style || "default"}:${
      colors?.sort().join(",") || ""
    }`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
    return encodeHex(hashBuffer).slice(0, 16); // Use first 16 chars for shorter hash
  }

  private isExpired(cached: CachedLogo): boolean {
    return Date.now() > cached.expiresAt;
  }

  private async getFromFile(promptHash: string): Promise<CachedLogo | null> {
    try {
      const filepath = join(this.cacheDir, `${promptHash}.json`);
      if (await exists(filepath)) {
        const content = await Deno.readTextFile(filepath);
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to read cache file for ${promptHash}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return null;
  }

  private async saveToFile(
    promptHash: string,
    cached: CachedLogo,
  ): Promise<void> {
    try {
      await ensureDir(this.cacheDir);
      const filepath = join(this.cacheDir, `${promptHash}.json`);
      await Deno.writeTextFile(filepath, JSON.stringify(cached, null, 2));
    } catch (error) {
      console.warn(
        `Warning: Failed to save cache file for ${promptHash}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (!await exists(this.cacheDir)) return;

      const expiredFiles: string[] = [];
      let totalSize = 0;

      // Scan for expired files and calculate total size
      for await (const entry of Deno.readDir(this.cacheDir)) {
        if (entry.isFile && entry.name.endsWith(".json")) {
          const filepath = join(this.cacheDir, entry.name);
          const stat = await Deno.stat(filepath);
          totalSize += stat.size;

          try {
            const content = await Deno.readTextFile(filepath);
            const cached = JSON.parse(content);
            if (this.isExpired(cached)) {
              expiredFiles.push(filepath);
            }
          } catch {
            // If we can't parse it, mark it for deletion
            expiredFiles.push(filepath);
          }
        }
      }

      // Remove expired files
      for (const filepath of expiredFiles) {
        await Deno.remove(filepath);
      }

      // If still over size limit, remove oldest files
      if (totalSize > this.maxSize) {
        await this.cleanupBySize();
      }

      // Clean memory cache of expired entries
      for (const [key, cached] of this.memoryCache) {
        if (this.isExpired(cached)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.warn(
        `Warning: Cache cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async cleanupBySize(): Promise<void> {
    const files: { path: string; mtime: Date; size: number }[] = [];

    for await (const entry of Deno.readDir(this.cacheDir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        const filepath = join(this.cacheDir, entry.name);
        const stat = await Deno.stat(filepath);
        files.push({
          path: filepath,
          mtime: stat.mtime || new Date(0),
          size: stat.size,
        });
      }
    }

    // Sort by modification time (oldest first)
    files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    let currentSize = files.reduce((sum, file) => sum + file.size, 0);

    // Remove oldest files until under size limit
    for (const file of files) {
      if (currentSize <= this.maxSize * 0.8) break; // Leave some headroom

      await Deno.remove(file.path);
      currentSize -= file.size;
    }
  }
}

interface CacheStats {
  memoryEntries: number;
  fileEntries: number;
  totalSizeBytes: number;
  totalSizeMB: number;
}
