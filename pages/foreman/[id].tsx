import { useEffect, useState } from "react";
import { useRouter } from "next/router";
declare global { interface Window { Telegram: any } }

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    const init = window.Telegram?.WebApp?.initData || "";
    const r = await fetch(`/api/project?id=${id}&initData=${encodeURIComponent(init)}`);
    if (!r.ok) { alert("Нет доступа"); return; }
    const j = await r.json();
    setData(j);

    if (j.invite_code) {
      // ЗАМЕНИТЕ <ВАШ_БОТ> и <ВАШ_APP> на реальные значения из BotFather
      setInviteUrl(`https://t.me/<ВАШ_БОТ>/<ВАШ_APP>?startapp=${j.invite_code}`);
    }
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Объект #{id}</h1>

      <div className="border rounded-xl p-4">
        <div className="font-medium mb-2">Приглашение рабочих</div>
        <div className="text-sm opacity-70 mb-2">Отправьте ссылку рабочим:</div>
        <div className="text-xs break-all border rounded p-2">
          {inviteUrl || "Ссылка появится после генерации invite_code"}
        </div>
      </div>

      <Section title="Отметки (чекин/чекаут)">
        {!data?.logs?.length && <Empty text="Нет отметок" />}
        {data?.logs?.map((l:any)=>(
          <div key={l.id} className="border rounded-lg p-3 mb-2">
            <div className="font-medium">{l.users?.name || "Рабочий"}</div>
            <div className="text-sm">Пришёл: {new Date(l.check_in).toLocaleString()}</div>
            <div className="text-sm">Ушёл: {l.check_out ? new Date(l.check_out).toLocaleString() : "—"}</div>
          </div>
        ))}
      </Section>

      <Section title="Скрытые работы">
        {!data?.works?.length && <Empty text="Пока нет фото скрытых работ" />}
        {data?.works?.map((w:any)=>(
          <div key={w.id} className="border rounded-lg p-3 mb-2">
            <div className="font-medium">{w.users?.name || "Рабочий"}</div>
            <div className="text-sm opacity-70">{new Date(w.created_at).toLocaleString()}</div>
            <div className="text-sm">Этап: {w.stage || "—"}</div>
            {w.comment && <div className="text-sm">Комментарий: {w.comment}</div>}
            {w.photo_url && <img src={w.photo_url} alt="" className="mt-2 rounded-lg" />}
          </div>
        ))}
      </Section>

      <Section title="Расходы (чеки)">
        {!data?.expenses?.length && <Empty text="Пока нет чеков" />}
        {data?.expenses?.map((e:any)=>(
          <div key={e.id} className="border rounded-lg p-3 mb-2">
            <div className="font-medium">{e.users?.name || "Рабочий"}</div>
            <div className="text-sm opacity-70">{new Date(e.created_at).toLocaleString()}</div>
            <div className="text-sm">Сумма: {e.amount ?? "—"}</div>
            {e.comment && <div className="text-sm">Комментарий: {e.comment}</div>}
            {e.photo_url && <img src={e.photo_url} alt="" className="mt-2 rounded-lg" />}
          </div>
        ))}
      </Section>

      <Section title="Участники">
        {!data?.participants?.length && <Empty text="Нет участников" />}
        {data?.participants?.map((p:any, idx:number)=>(
          <div key={idx} className="border rounded-lg p-3 mb-2 flex justify-between">
            <div>{p.users?.name || "Пользователь"}</div>
            <div className="opacity-70">{p.role === "foreman" ? "прораб" : "рабочий"}</div>
          </div>
        ))}
      </Section>
    </main>
  );
}
function Section({title, children}:{title:string; children:any}) {
  return (<section><h2 className="font-semibold mb-2">{title}</h2>{children}</section>);
}
function Empty({text}:{text:string}) { return <div className="text-sm opacity-60">{text}</div>; }
