import { useEffect, useState } from "react";
declare global { interface Window { Telegram: any } }

export default function Foreman() {
  const [initData, setInitData] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    setInitData(tg?.initData || "");
    load();
  }, []);

  async function load() {
    const r = await fetch("/api/projects?initData=" + encodeURIComponent(window.Telegram?.WebApp?.initData || ""));
    const j = await r.json();
    setProjects(j.projects || []);
  }

  async function createProject() {
    if (!title.trim()) return alert("Укажите название");
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ initData, title, description })
    });
    if (!r.ok) return alert("Ошибка создания");
    setTitle(""); setDescription("");
    load();
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Мои объекты</h1>

      <div className="border rounded-xl p-4 space-y-2">
        <h2 className="font-medium">Создать объект</h2>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название"
          className="w-full border rounded-lg p-3" />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Описание"
          className="w-full border rounded-lg p-3" />
        <button onClick={createProject} className="w-full rounded-xl py-3 bg-blue-600 text-white">Создать</button>
      </div>

      <div className="space-y-3">
        {projects.map((p:any) => (
          <a key={p.project_id} href={`/foreman/${p.projects.id}`} className="block border rounded-xl p-4">
            <div className="font-medium">{p.projects.title}</div>
            <div className="text-sm opacity-70">{p.projects.description || "Без описания"}</div>
          </a>
        ))}
        {!projects.length && <div className="opacity-60 text-sm">Пока нет объектов</div>}
      </div>
    </main>
  );
}
