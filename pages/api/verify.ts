import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInitData } from "@lib/verifyTelegram";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { initData } = req.body || {};
  const v = verifyInitData(initData || "", process.env.TELEGRAM_BOT_TOKEN!);
  return res.status(v.ok ? 200 : 401).json({ ok: v.ok, userId: v.userId });
}
