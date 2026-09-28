import { Router } from "express";
import { requireAuth, getUser } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, (req, res) => {
  const u = getUser(req)!;
  res.json({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  });
});

/** Client clears OIDC tokens locally; endpoint kept for compatibility. */
authRouter.post("/logout", (_req, res) => {
  res.json({ ok: true });
});
