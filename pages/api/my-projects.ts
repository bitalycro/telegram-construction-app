import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { initData } = req.query || {};
  const v = verifyInitData(String(initData || ""), process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const { data: u } = await supabaseAdmin
    .from("users").select("id, role, name").eq("telegram_id", v.userId).maybeSingle();
  if (!u) return res.status(403).json({ error: "user not found" });

  const { data, error } = await supabaseAdmin
    .from("user_projects")
    .select("project_id, role, projects:project_id ( id, title, description )")
    .eq("user_id", u.id);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ role: u.role, projects: data || [] });
}
