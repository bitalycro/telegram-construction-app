# Строй Мини-апп (Telegram Mini App)

Мини-приложение для строительных бригад с ролями **прораб** и **рабочий**. Интерфейс и инструкции — на русском.

## Быстрый старт
1) Создайте проект на Supabase. В разделе **SQL Editor** выполните `supabase/schema.sql` из этого репозитория. В **Storage** создайте публичные buckets: `expenses` и `hidden-works`.
2) Скопируйте `.env.local.example` в `.env.local` и заполните:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
```
3) Локально: `npm i` → `npm run dev` (или сразу деплой на Vercel).
4) На Vercel: импортируйте репозиторий → добавьте те же переменные окружения → Deploy.
5) В @BotFather: **Bot Settings → Configure Mini App** → установите HTTPS-URL вашего деплоя (например, https://<ваш>.vercel.app). Опционально создайте `/newapp` для прямой ссылки вида: `https://t.me/<ВАШ_БОТ>/<ВАШ_APP>?startapp=<invite_code>`.

## Роли
- **Прораб**: создаёт объект, видит отметки (чекин/чекаут), расходы и скрытые работы, приглашает рабочих.
- **Рабочий**: отмечается, отправляет фото чеков и фото скрытых работ. Не видит участников и отчёты.

Подробности см. в исходниках страниц `pages/foreman.tsx`, `pages/foreman/[id].tsx`, `pages/worker.tsx`.
