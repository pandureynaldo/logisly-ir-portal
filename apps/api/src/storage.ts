import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "./config.js";

export interface StoredFile {
  storageKey: string;
  absolutePath: string;
}

export interface Storage {
  put(buffer: Buffer, ext: string): Promise<StoredFile>;
  getAbsolutePath(storageKey: string): string;
  openReadStream(storageKey: string): Promise<import("node:fs").ReadStream>;
}

/** Local disk storage. Swap for S3/GCS later behind this interface. */
export class LocalDiskStorage implements Storage {
  constructor(private root = env.storageDir) {}

  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
  }

  async put(buffer: Buffer, ext: string): Promise<StoredFile> {
    await this.ensureRoot();
    const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
    const storageKey = `${randomUUID()}.${safeExt}`;
    const absolutePath = path.join(this.root, storageKey);
    await fs.writeFile(absolutePath, buffer, { flag: "wx" });
    return { storageKey, absolutePath };
  }

  getAbsolutePath(storageKey: string): string {
    const base = path.resolve(this.root);
    const full = path.resolve(this.root, storageKey);
    if (!full.startsWith(base + path.sep) && full !== base) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async openReadStream(storageKey: string) {
    const { createReadStream } = await import("node:fs");
    return createReadStream(this.getAbsolutePath(storageKey));
  }
}

export const storage = new LocalDiskStorage();
