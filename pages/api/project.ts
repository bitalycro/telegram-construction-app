import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { initData, id } = req.query || {};
  const v = verifyInitData(String(initData || ""), process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const projectId = Number(id);
  if (!projectId) return res.status(400).json({ error: "no project id" });

  const { data: u } = await supabaseAdmin
    .from("users").select("id, role").eq("telegram_id", v.userId).maybeSingle();
  if (!u) return res.status(403).json({ error: "user not found" });

  const { data: link } = await supabaseAdmin
    .from("user_projects").select("role").eq("user_id", u.id).eq("project_id", projectId).maybeSingle();
  if (!link || link.role !== "foreman") return res.status(403).json({ error: "forbidden" });

  const [project, logs, expenses, works, participants] = await Promise.all([
    supabaseAdmin.from("projects").select("invite_code").eq("id", projectId).maybeSingle(),
    supabaseAdmin.from("time_logs")
      .select("id, check_in, check_out, user_id, users:user_id ( name )")
      .eq("project_id", projectId).order("check_in", { ascending: false }),
    supabaseAdmin.from("expenses")
      .select("id, created_at, amount, comment, photo_url, user_id, users:user_id ( name )")
      .eq("project_id", projectId).order("created_at", { ascending: false }),
    supabaseAdmin.from("hidden_works")
      .select("id, created_at, stage, comment, photo_url, user_id, users:user_id ( name )")
      .eq("project_id", projectId).order("created_at", { ascending: false }),
    supabaseAdmin.from("user_projects")
      .select("role, users:user_id ( name, id )")
      .eq("project_id", projectId)
  ]);

  return res.json({
    invite_code: project?.data?.invite_code || null,
    logs: logs.data || [],
    expenses: expenses.data || [],
    works: works.data || [],
    participants: participants.data || []
  });
}
