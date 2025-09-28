import { useEffect, useRef, useState } from "react";
import { supabaseClient } from "@lib/supabaseClient";
declare global { interface Window { Telegram: any } }

export default function Worker() {
  const [initData, setInitData] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [expComment, setExpComment] = useState<string>("");
  const [workStage, setWorkStage] = useState<string>("");
  const [workComment, setWorkComment] = useState<string>("");

  const receiptInput = useRef<HTMLInputElement>(null);
  const workInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready?.(); tg?.expand?.();
    const init = tg?.initData || "";
    setInitData(init);

    const code = sessionStorage.getItem("invite_code");
    if (code) {
      fetch("/api/join", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ initData: init, invite_code: code })
      }).finally(()=>{ sessionStorage.removeItem("invite_code"); loadMyProjects(init); });
    } else {
      loadMyProjects(init);
    }
  }, []);

  async function loadMyProjects(init: string) {
    const r = await fetch("/api/my-projects?initData=" + encodeURIComponent(init));
    const j = await r.json();
    const first = (j.projects || [])[0];
    setProjectId(first?.projects?.id || null);
  }

  async function getCoords(): Promise<{lat:number|null; lon:number|null}> {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.requestLocation) {
        const pos = await tg.requestLocation();
        return { lat: pos.latitude, lon: pos.longitude };
      }
    } catch {}
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({lat:null, lon:null});
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat:null, lon:null }),
        { enableHighAccuracy:true, timeout:6000 }
      );
    });
  }

  async function check(action:"checkin"|"checkout") {
    if (!projectId) return alert("Нет проекта");
    const { lat, lon } = await getCoords();
    const r = await fetch("/api/checkin", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData, project_id: projectId, action, lat, lon })
    });
    if (!r.ok) return alert("Ошибка");
    alert(action === "checkin" ? "Отметка сделана" : "Уход зафиксирован");
  }

  async function uploadToBucket(file: File, bucket: "expenses"|"hidden-works") {
    const filePath = `${Date.now()}_${file.name}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600", upsert: false
    });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function sendExpense() {
    if (!projectId) return alert("Нет проекта");
    const file = receiptInput.current?.files?.[0];
    if (!file) return alert("Выберите фото чека");
    const url = await uploadToBucket(file, "expenses");
    const r = await fetch("/api/expense", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData, project_id: projectId, photo_url: url, amount, comment: expComment })
    });
    if (!r.ok) return alert("Ошибка загрузки чека");
    setAmount(""); setExpComment(""); if (receiptInput.current) receiptInput.current.value = "";
    alert("Чек отправлен");
  }

  async function sendHidden() {
    if (!projectId) return alert("Нет проекта");
    const file = workInput.current?.files?.[0];
    if (!file) return alert("Выберите фото");
    const url = await uploadToBucket(file, "hidden-works");
    const r = await fetch("/api/hidden", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData, project_id: projectId, photo_url: url, stage: workStage, comment: workComment })
    });
    if (!r.ok) return alert("Ошибка загрузки");
    setWorkStage(""); setWorkComment(""); if (workInput.current) workInput.current.value = "";
    alert("Фото скрытых работ отправлено");
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Рабочий</h1>
      {!projectId && <div className="opacity-70">Подождите, загружаем проект или используйте ссылку-приглашение от прораба…</div>}

      <section className="border rounded-xl p-4">
        <h2 className="font-medium mb-2">Отметка присутствия</h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={()=>check("checkin")} className="rounded-xl py-3 bg-emerald-600 text-white">Отметиться</button>
          <button onClick={()=>check("checkout")} className="rounded-xl py-3 bg-rose-600 text-white">Уйти</button>
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-2">
        <h2 className="font-medium">Расход (чек)</h2>
        <input type="number" placeholder="Сумма" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border rounded-lg p-3" />
        <input type="text" placeholder="Комментарий (например, что купили)" value={expComment} onChange={e=>setExpComment(e.target.value)} className="w-full border rounded-lg p-3" />
        <input ref={receiptInput} type="file" accept="image/*" className="w-full border rounded-lg p-2" />
        <button onClick={sendExpense} className="w-full rounded-xl py-3 bg-blue-600 text-white">Отправить чек</button>
      </section>

      <section className="border rounded-xl p-4 space-y-2">
        <h2 className="font-medium">Скрытые работы</h2>
        <input type="text" placeholder="Этап (например, электрика)" value={workStage} onChange={e=>setWorkStage(e.target.value)} className="w-full border rounded-lg p-3" />
        <input type="text" placeholder="Комментарий (опционально)" value={workComment} onChange={e=>setWorkComment(e.target.value)} className="w-full border rounded-lg p-3" />
        <input ref={workInput} type="file" accept="image/*" className="w-full border rounded-lg p-2" />
        <button onClick={sendHidden} className="w-full rounded-xl py-3 bg-indigo-600 text-white">Отправить фото</button>
      </section>
    </main>
  );
}
