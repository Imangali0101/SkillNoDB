import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api';
import { STATUS, fmtDate } from '../utils';

function Review({ id, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const send = async () => {
    try { await api(`/sessions/${id}/review`, { method: 'POST', body: { rating, comment } }); onDone(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <div className="row wrap mt">
      <select value={rating} onChange={(e) => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
      <input className="grow" placeholder="Отзыв о занятии" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn primary" onClick={send}>Оставить отзыв</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export default function Sessions() {
  const me = useSelector((s) => s.auth.user);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api('/sessions').then(setList);
  useEffect(() => { load(); }, []);
  const act = async (id, what) => {
    try { setErr(''); await api(`/sessions/${id}/${what}`, { method: 'POST' }); load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div className="wrap pad">
      <h2>Мои занятия</h2>
      {err && <p className="err">{err}</p>}
      {list.length === 0 && <p className="muted">Занятий пока нет. Найдите партнёра во вкладке «Найти партнёра».</p>}
      {list.map((s) => {
        const isTeacher = s.teacher_id === me.id;
        const mine = isTeacher ? s.teacher_confirmed : s.learner_confirmed;
        return (
          <div key={s.id} className="card">
            <div className="row wrap">
              <div className="grow">
                <b>{s.skill}</b> · {isTeacher ? `ученик: ${s.learner_name}` : `преподаёт: ${s.teacher_name}`}
                <div className="muted">{fmtDate(s.starts_at)} · {isTeacher ? '+' : '−'}{s.price} SP</div>
              </div>
              <span className={'tag ' + (s.status === 'completed' ? 'g' : s.status === 'cancelled' ? 'r' : 'y')}>{STATUS[s.status]}</span>
            </div>
            {s.status === 'booked' && (
              <div className="row mt">
                {mine ? <span className="muted">Вы подтвердили · ждём вторую сторону</span>
                  : <button className="btn primary" onClick={() => act(s.id, 'confirm')}>Занятие состоялось</button>}
                <button className="btn ghost" onClick={() => act(s.id, 'cancel')}>Отменить</button>
              </div>
            )}
            {s.status === 'completed' && !isTeacher && !s.reviewed && <Review id={s.id} onDone={load} />}
          </div>
        );
      })}
    </div>
  );
}
