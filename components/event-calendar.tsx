import { CalendarDays, Clock, Mail, Sparkles } from "lucide-react";
import { externalEmbeds } from "@/lib/editable-content";
import { mailHref, site } from "@/lib/site";

export function EventCalendarSection({ note }: { note?: string }) {
  return (
    <section className="section event-calendar-section">
      <div className="event-calendar-copy">
        <div className="section-heading narrow-copy">
          <p className="eyebrow">Calendar</p>
          <h2>最新イベントをGoogle Calendarで確認</h2>
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
        {note ? <p className="section-lead">{note}</p> : null}
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
