import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { initData, project_id, photo_url, amount, comment } = req.body || {};
  const v = verifyInitData(initData || "", process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const { data: u } = await supabaseAdmin.from("users").select("id").eq("telegram_id", v.userId).maybeSingle();
  if (!u) return res.status(403).json({ error: "user not found" });

  const pId = Number(project_id);
  if (!pId) return res.status(400).json({ error: "no project id" });

  const { error } = await supabaseAdmin.from("expenses").insert({
    user_id: u.id, project_id: pId, photo_url, amount: amount ? Number(amount) : null, comment
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
