import { useEffect, useState } from "react";
import { useRouter } from "next/router";
declare global { interface Window { Telegram: any } }

export default function Home() {
  const router = useRouter();
  const [initData, setInitData] = useState("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();

    const init = tg?.initData || "";
    setInitData(init);
    try {
      const u = tg?.initDataUnsafe?.user;
      if (u?.first_name) setUserName(u.first_name);
      const startParam = tg?.initDataUnsafe?.start_param;
      if (startParam) sessionStorage.setItem("invite_code", startParam);
    } catch {}
  }, []);

  async function pickRole(role: "foreman"|"worker") {
    const name = userName || "Пользователь";
    const resp = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ initData, role, name })
    });
    if (!resp.ok) return alert("Ошибка авторизации");
    router.push(role === "foreman" ? "/foreman" : "/worker");
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Строй Мини-апп</h1>
      <p className="opacity-70">Выберите вашу роль:</p>
      <div className="grid gap-3">
        <button onClick={() => pickRole("foreman")}
          className="w-full rounded-xl py-4 px-5 bg-blue-600 text-white">Я прораб</button>
        <button onClick={() => pickRole("worker")}
          className="w-full rounded-xl py-4 px-5 bg-emerald-600 text-white">Я рабочий</button>
      </div>
    </main>
  );
}
