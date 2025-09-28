import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { initData } = req.body || req.query || {};
  const v = verifyInitData(String(initData || ""), process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const { data: user } = await supabaseAdmin
    .from("users").select("id, role, name")
    .eq("telegram_id", v.userId).maybeSingle();
  if (!user) return res.status(403).json({ error: "user not found" });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("user_projects")
      .select("project_id, role, projects:project_id ( id, title, description, invite_code )")
      .eq("user_id", user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ projects: data || [] });
  }

  if (req.method === "POST") {
    if (user.role !== "foreman") return res.status(403).json({ error: "only foreman can create" });
    const { title, description } = req.body || {};
    const invite_code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data: p, error } = await supabaseAdmin
      .from("projects")
      .insert({ title, description, created_by: user.id, invite_code })
      .select("id, title, description, invite_code")
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await supabaseAdmin.from("user_projects").insert({
      user_id: user.id, project_id: p.id, role: "foreman"
    });

    return res.json({ project: p });
  }

  return res.status(405).end();
}
