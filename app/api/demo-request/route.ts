import { NextResponse } from 'next/server';

// Заявка с формы «Запросить демо» → сообщение админу в Telegram.
// Требует TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.local
export async function POST(req: Request) {
  let data: Record<string, string>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  if (!name || !email) {
    return NextResponse.json({ ok: false, error: 'Укажите имя и email' }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: 'Приём заявок временно недоступен' },
      { status: 500 },
    );
  }

  const text = [
    '🩻 Новая заявка на демо — WaspMed Draft',
    '',
    `👤 Имя: ${name}`,
    `🏥 Организация: ${(data.org || '—').trim() || '—'}`,
    `📧 Email: ${email}`,
    `📞 Телефон: ${(data.phone || '—').trim() || '—'}`,
    '',
    `💬 Комментарий: ${(data.msg || '—').trim() || '—'}`,
  ].join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!tgRes.ok) {
      console.error('demo-request: Telegram API error', tgRes.status, await tgRes.text());
      return NextResponse.json(
        { ok: false, error: 'Не удалось отправить заявку, попробуйте ещё раз' },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error('demo-request: Telegram fetch failed', err);
    return NextResponse.json(
      { ok: false, error: 'Сервис уведомлений не ответил, попробуйте ещё раз' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
