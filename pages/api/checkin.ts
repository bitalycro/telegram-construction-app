import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";
import { supabaseAdmin } from "@lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { initData, project_id, action, lat, lon } = req.body || {};
  const v = verifyInitData(initData || "", process.env.TELEGRAM_BOT_TOKEN!);
  if (!v.ok || !v.userId) return res.status(401).json({ error: "bad initData" });

  const { data: u } = await supabaseAdmin.from("users").select("id").eq("telegram_id", v.userId).maybeSingle();
  if (!u) return res.status(403).json({ error: "user not found" });

  const pId = Number(project_id);
  if (!pId) return res.status(400).json({ error: "no project id" });

  if (action === "checkin") {
    const { error } = await supabaseAdmin.from("time_logs").insert({
      user_id: u.id,
      project_id: pId,
      check_in: new Date().toISOString(),
      check_in_location: lat && lon ? `(${lon},${lat})` : null
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  if (action === "checkout") {
    const { data: open } = await supabaseAdmin
      .from("time_logs").select("id")
      .eq("user_id", u.id).eq("project_id", pId).is("check_out", null)
      .order("check_in", { ascending: false }).limit(1).maybeSingle();
    if (!open) return res.status(400).json({ error: "no open shift" });

    const { error } = await supabaseAdmin
      .from("time_logs").update({
        check_out: new Date().toISOString(),
        check_out_location: lat && lon ? `(${lon},${lat})` : null
      }).eq("id", open.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: "bad action" });
}
