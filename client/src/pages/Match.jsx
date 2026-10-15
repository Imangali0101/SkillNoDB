import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../api';
import { LEVELS, initials } from '../utils';

const CRIT = { S: 'Навык', T: 'Время', R: 'Рейтинг', L: 'Уровень', P: 'Формат' };

export default function Match() {
  const user = useSelector((s) => s.auth.user);
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState(user.goals[0]?.id || '');
  const [level, setLevel] = useState(user.goals[0]?.level || 1);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api('/skills').then(setSkills).catch((e) => setErr(e.message)); }, []);
  useEffect(() => {
    if (!skillId) { setRes(null); return; }
    setRes(null);
    setErr('');
    api(`/match?skill_id=${skillId}&level=${level}`).then(setRes).catch((e) => setErr(e.message));
  }, [skillId, level]);

  const pick = (id) => {
    setSkillId(id);
    const g = user.goals.find((x) => x.id === +id);
    if (g) setLevel(g.level);
  };

  return (
    <div className="wrap pad">
      <h2>Поиск партнёра</h2>
      <div className="card row wrap">
        <label className="grow">Хочу изучить
          <select value={skillId} onChange={(e) => pick(e.target.value)}>
            <option value="">Выберите навык…</option>
            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>Мой уровень
          <select value={level} onChange={(e) => setLevel(+e.target.value)}>
            {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {user.availability.length === 0 && <p className="err">Сначала укажите свободное время в профиле — без него совпадений не будет.</p>}
      {err && <p className="err">{err}</p>}
      {res && res.length === 0 && <p className="muted">Подходящих студентов по этому расписанию нет.</p>}
      <div className="list">
        {res?.map((c) => (
          <div key={c.id} className="card cand">
            <div className="row">
              <div className="ava big">{initials(c.name)}</div>
              <div className="grow">
                <b>{c.name}</b> <span className="muted">· {LEVELS[c.level]}</span>
                <div className="chips">
                  {c.rating ? <span className="tag y">{c.rating.toFixed(1)} ★ ({c.reviews})</span> : <span className="tag">Новичок</span>}
                  <span className="tag">Занятий: {c.done}</span>
                  <span className="tag">Общих часов: {c.shared.length}</span>
                  {c.mutual && <span className="tag g">Взаимный обмен</span>}
                </div>
              </div>
              <div className="score"><b>{c.score}</b><span>из 100</span></div>
            </div>
            <div className="bars">
              {Object.entries(c.breakdown).map(([k, v]) => (
                <div key={k}><span className="sm muted">{CRIT[k]}</span><div className="bar"><i style={{ width: v + '%' }} /></div></div>
              ))}
            </div>
            <Link className="btn primary" to={`/teacher/${c.id}?skill=${skillId}&score=${c.score}`}>Выбрать время</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
