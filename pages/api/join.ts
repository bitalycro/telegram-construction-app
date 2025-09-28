import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { initData, invite_code } = req.body || {};
  const v = verifyInitData(initData || "", process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const { data: user } = await supabaseAdmin
    .from("users").select("id, role").eq("telegram_id", v.userId).maybeSingle();
  if (!user) return res.status(403).json({ error: "user not found" });

  const { data: project } = await supabaseAdmin
    .from("projects").select("id, title").eq("invite_code", invite_code).maybeSingle();
  if (!project) return res.status(404).json({ error: "invalid invite_code" });

  const { data: exist } = await supabaseAdmin
    .from("user_projects").select("user_id").eq("user_id", user.id).eq("project_id", project.id).maybeSingle();
  if (!exist) {
    await supabaseAdmin.from("user_projects").insert({
      user_id: user.id, project_id: project.id, role: "worker"
    });
  }
  return res.json({ ok: true, project });
}
