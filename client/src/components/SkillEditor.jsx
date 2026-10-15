import { useState } from 'react';
import { api } from '../api';
import { LEVELS } from '../utils';

// kind: 'skills' — что умею, 'goals' — что хочу изучить
export default function SkillEditor({ title, kind, items, allSkills, onSaved, onNewSkill }) {
  const [skill, setSkill] = useState('');
  const [level, setLevel] = useState(2);
  const [custom, setCustom] = useState('');
  const [err, setErr] = useState('');

  const add = async () => {
    try {
      setErr('');
      let id = skill;
      if (custom.trim()) {
        id = (await api('/skills', { method: 'POST', body: { name: custom } })).id;
        setCustom('');
        onNewSkill();
      }
      if (!id) return setErr('Выберите навык');
      onSaved(await api(`/me/${kind}`, { method: 'PUT', body: { skill_id: +id, level: +level } }));
      setSkill('');
    } catch (e) { setErr(e.message); }
  };
  const del = async (id) => onSaved(await api(`/me/${kind}/${id}`, { method: 'DELETE' }));

  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="chips">
        {items.length === 0 && <span className="muted">Пока пусто</span>}
        {items.map((s) => (
          <span key={s.id} className="tag">{s.name} · {LEVELS[s.level]} <button onClick={() => del(s.id)} title="Удалить">×</button></span>
        ))}
      </div>
      <div className="row mt wrap">
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Выберите навык…</option>
          {allSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="или свой навык" value={custom} onChange={(e) => setCustom(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn primary" onClick={add}>Добавить</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
