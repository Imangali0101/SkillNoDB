import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api';
import { setUser } from '../store';
import { FORMATS } from '../utils';
import SkillEditor from '../components/SkillEditor';
import Availability from '../components/Availability';

export default function Profile() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [allSkills, setAllSkills] = useState([]);
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', format: user.format });
  const [msg, setMsg] = useState('');
  const loadSkills = () => api('/skills').then(setAllSkills);
  useEffect(() => { loadSkills(); }, []);
  const saved = (p) => dispatch(setUser(p));

  const saveInfo = async () => {
    try { saved(await api('/me', { method: 'PUT', body: form })); setMsg('Сохранено ✓'); }
    catch (e) { setMsg(e.message); }
  };

  return (
    <div className="wrap pad">
      <h2>Мой профиль</h2>
      <div className="card">
        <div className="row wrap">
          <label className="grow">Имя<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Формат занятий
            <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label>О себе<textarea rows="2" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
        <div className="row"><button className="btn primary" onClick={saveInfo}>Сохранить</button><span className="muted">{msg}</span></div>
      </div>
      <div className="two">
        <SkillEditor title="Я умею (могу учить)" kind="skills" items={user.skills} allSkills={allSkills} onSaved={saved} onNewSkill={loadSkills} />
        <SkillEditor title="Хочу изучить" kind="goals" items={user.goals} allSkills={allSkills} onSaved={saved} onNewSkill={loadSkills} />
      </div>
      <div className="card">
        <h3>Когда я свободен</h3>
        <p className="muted">Отметьте часы, в которые можете заниматься. Мэтчинг использует только пересечения с расписанием партнёра.</p>
        <Availability initial={user.availability} onSave={async (slots) => saved(await api('/me/availability', { method: 'PUT', body: { slots } }))} />
      </div>
    </div>
  );
}
