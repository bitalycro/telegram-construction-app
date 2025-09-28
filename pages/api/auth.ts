import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { initData, role, name } = req.body || {};
  const v = verifyInitData(initData || "", process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const telegram_id = v.userId;
  const roleSafe = role === "foreman" ? "foreman" : "worker";

  const { data: existing } = await supabaseAdmin
    .from("users").select("id, role").eq("telegram_id", telegram_id).maybeSingle();

  if (!existing) {
    const { error } = await supabaseAdmin.from("users").insert({
      telegram_id, name: name || "Пользователь", role: roleSafe
    });
    if (error) return res.status(500).json({ error: error.message });
  } else if (existing.role !== roleSafe) {
    const { error } = await supabaseAdmin.from("users")
      .update({ role: roleSafe }).eq("telegram_id", telegram_id);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true, role: roleSafe });
}
