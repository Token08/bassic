import { CalendarDays, Clock, Mail, Sparkles } from "lucide-react";
import { externalEmbeds } from "@/lib/editable-content";
import { mailHref, site } from "@/lib/site";
import type { EventItem } from "@/lib/types";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthDays(monthDate: Date, eventsByDate: Map<string, EventItem[]>) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const key = dateKey(current);

    return {
      key,
      day: current.getDate(),
      inMonth: current.getMonth() === monthDate.getMonth(),
      events: eventsByDate.get(key) || []
    };
  });
}

function EventColorCalendar({ events }: { events: EventItem[] }) {
  const visibleEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const baseDate = visibleEvents[0]?.date ? parseDateKey(visibleEvents[0].date) : new Date();
  const months = [baseDate, addMonths(baseDate, 1)];
  const eventsByDate = new Map<string, EventItem[]>();

  visibleEvents.forEach((event) => {
    const items = eventsByDate.get(event.date) || [];
    items.push(event);
    eventsByDate.set(event.date, items);
  });

  return (
    <div className="event-color-calendar" aria-label="イベント日の色分けカレンダー">
      <div className="calendar-legend" aria-label="カレンダーの色分け">
        <span>
          <i className="legend-dot legend-dot-event" />
          イベント日
        </span>
        <span>
          <i className="legend-dot legend-dot-holiday" />
          店休日はGoogle Calendar側の表示を確認
        </span>
      </div>
      <div className="event-mini-months">
        {months.map((monthDate) => (
          <article className="event-mini-month" key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
            <h3>
              {monthDate.getFullYear()}年{monthDate.getMonth() + 1}月
            </h3>
            <div className="event-mini-weekdays" aria-hidden="true">
              {weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="event-mini-days">
              {buildMonthDays(monthDate, eventsByDate).map((day) => (
                <div
                  className={`event-mini-day${day.inMonth ? "" : " is-outside"}${day.events.length ? " is-event-day" : ""}`}
                  key={day.key}
                  title={day.events.map((event) => event.title).join(" / ")}
                >
                  <span>{day.day}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EventCalendarSection({ events }: { events: EventItem[] }) {
  return (
    <section className="section event-calendar-section">
      <div className="event-calendar-copy">
        <div className="section-heading narrow-copy">
          <p className="eyebrow">Calendar</p>
          <h2>
            最新イベントを、
            <br />
            カレンダーで確認。
          </h2>
          <p className="section-lead">
            元ページで使っていたGoogle Calendarを引き継ぎました。ライブ、DJ、貸切予定を確認できます。
          </p>
        </div>
        <div className="calendar-note-grid" aria-label="イベント確認の補足">
          <div className="calendar-note-card">
            <CalendarDays size={18} />
            <span>イベント日は営業時間が変動します</span>
          </div>
          <div className="calendar-note-card">
            <Clock size={18} />
            <span>通常営業は20:00 OPENです</span>
          </div>
          <div className="calendar-note-card">
            <Sparkles size={18} />
            <span>予約や出演相談はメールで受付中</span>
          </div>
        </div>
        <div className="hero-actions event-calendar-actions">
          <a className="button primary" href={externalEmbeds.googleCalendarPublicUrl} target="_blank" rel="noreferrer">
            <CalendarDays size={18} />
            Google Calendarで開く
          </a>
          <a className="button" href={mailHref("Bassic.イベント予約")}>
            <Mail size={18} />
            イベント予約メール
          </a>
        </div>
        <EventColorCalendar events={events} />
      </div>
      <div className="event-calendar-frame-wrap">
        <iframe
          title={`${site.name} event calendar`}
          className="event-calendar-frame"
          src={externalEmbeds.googleCalendarEmbedUrl}
          loading="lazy"
        />
      </div>
    </section>
  );
}
