import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

export const runbooksRouter = Router();

function safeSlug(slug: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/i.test(slug)) return null;
  return slug.toLowerCase();
}

function titleFromMarkdown(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim() || fallback;
}

async function listRunbookFiles(): Promise<
  Array<{ slug: string; filename: string; title: string }>
> {
  let names: string[];
  try {
    names = await fs.readdir(env.runbooksDir);
  } catch {
    return [];
  }
  const out: Array<{ slug: string; filename: string; title: string }> = [];
  for (const name of names) {
    if (!name.endsWith(".md") || name.toLowerCase() === "readme.md") continue;
    const slug = name.slice(0, -3);
    if (!safeSlug(slug)) continue;
    const body = await fs.readFile(path.join(env.runbooksDir, name), "utf8");
    out.push({
      slug,
      filename: name,
      title: titleFromMarkdown(body, slug),
    });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

runbooksRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json(await listRunbookFiles());
  } catch (err) {
    next(err);
  }
});

runbooksRouter.get("/:slug", requireAuth, async (req, res, next) => {
  try {
    const slug = safeSlug(req.params.slug);
    if (!slug) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    const filePath = path.resolve(env.runbooksDir, `${slug}.md`);
    if (
      !filePath.startsWith(path.resolve(env.runbooksDir) + path.sep) &&
      filePath !== path.resolve(env.runbooksDir)
    ) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }
    let body: string;
    try {
      body = await fs.readFile(filePath, "utf8");
    } catch {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      slug,
      filename: `${slug}.md`,
      title: titleFromMarkdown(body, slug),
      content: body,
    });
  } catch (err) {
    next(err);
  }
});
