import crypto from "crypto";

export function verifyInitData(initData: string, botToken: string): { ok: boolean; userId?: number } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash") || "";
    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const check = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

    if (check !== hash) return { ok: false };

    const authDate = Number(params.get("auth_date") || 0);
    const now = Math.floor(Date.now() / 1000);
    if (!authDate || now - authDate > 3600 * 6) return { ok: false };

    const userRaw = params.get("user");
    if (!userRaw) return { ok: false };
    const user = JSON.parse(userRaw);
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false };
  }
}
