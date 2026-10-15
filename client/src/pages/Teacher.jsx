import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { DAYS, LEVELS, fmtSlot, initials } from '../utils';

export default function Teacher() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [slot, setSlot] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const skillId = +sp.get('skill') || data?.skills[0]?.id;

  useEffect(() => { api(`/users/${id}`).then(setData).catch((e) => setErr(e.message)); }, [id]);
  if (err && !data) return <div className="wrap pad err">{err}</div>;
  if (!data) return <div className="wrap pad muted">Загрузка…</div>;

  const { user, skills, reviews, shared } = data;
  const book = async () => {
    setBusy(true);
    try {
      await api('/sessions', { method: 'POST', body: { teacher_id: user.id, skill_id: skillId, day: slot.day, hour: slot.hour, score: +sp.get('score') } });
      nav('/sessions');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="wrap pad">
      <div className="card row">
        <div className="ava big">{initials(user.name)}</div>
        <div><h2 style={{ margin: 0 }}>{user.name}</h2><span className="muted">{user.bio || 'Студент SkillSwap'}</span></div>
      </div>
      <div className="two">
        <div className="card">
          <h3>Навыки и рейтинг преподавания</h3>
          {skills.map((s) => (
            <div key={s.id} className={'skill-row' + (s.id === skillId ? ' sel' : '')}>
              <b>{s.name}</b>
              <span className="muted">Владение: {LEVELS[s.level]}</span>
              <span>{s.rating ? `${s.rating.toFixed(1)} ★ (${s.reviews})` : 'нет оценок'} · занятий {s.done}</span>
            </div>
          ))}
          <h3 className="mt">Отзывы</h3>
          {reviews.length === 0 && <p className="muted">Пока нет отзывов</p>}
          {reviews.map((r, i) => (
            <div key={i} className="review"><b>{r.author}</b> · {r.skill} · <span className="yellow">{'★'.repeat(r.rating)}</span><p>{r.comment}</p></div>
          ))}
        </div>
        <div className="card">
          <h3>Забронировать час · 10 SP</h3>
          {shared.length === 0 && <p className="muted">Нет общего свободного времени.</p>}
          {DAYS.map((d, di) => {
            const hrs = shared.filter((s) => s.day === di);
            return hrs.length ? (
              <div key={d} className="row wrap mb"><b className="dayl">{d}</b>
                {hrs.map((s) => (
                  <button key={s.hour} className={'slot' + (slot?.day === s.day && slot?.hour === s.hour ? ' on' : '')} onClick={() => setSlot(s)}>{String(s.hour).padStart(2, '0')}:00</button>
                ))}
              </div>
            ) : null;
          })}
          {err && <p className="err">{err}</p>}
          <button className="btn primary full mt" disabled={!slot || !skillId || busy} onClick={book}>
            {slot ? `Забронировать: ${fmtSlot(slot)}` : 'Выберите время'}
          </button>
          <p className="muted sm">Баллы резервируются при брони и переводятся после подтверждения занятия обеими сторонами.</p>
        </div>
      </div>
    </div>
  );
}
