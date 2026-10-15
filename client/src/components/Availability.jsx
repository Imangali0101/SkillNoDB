import { useState } from 'react';
import { DAYS } from '../utils';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00–22:00

// Редактируемая сетка свободного времени (день × час)
export default function Availability({ initial, onSave }) {
  const [set, setSet] = useState(new Set(initial.map((a) => a.day * 24 + a.hour)));
  const [msg, setMsg] = useState('');
  const toggle = (k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); setSet(n); setMsg(''); };
  const save = async () => {
    try {
      await onSave([...set].map((k) => ({ day: Math.floor(k / 24), hour: k % 24 })));
      setMsg('Сохранено ✓');
    } catch (e) { setMsg(e.message); }
  };
  return (
    <div>
      <div className="grid-av">
        <span />
        {DAYS.map((d) => <b key={d} className="muted">{d}</b>)}
        {HOURS.map((h) => (
          <div key={h} style={{ display: 'contents' }}>
            <span className="muted sm">{String(h).padStart(2, '0')}:00</span>
            {DAYS.map((_, d) => (
              <button key={d} type="button" className={'cell' + (set.has(d * 24 + h) ? ' on' : '')} onClick={() => toggle(d * 24 + h)} />
            ))}
          </div>
        ))}
      </div>
      <div className="row mt">
        <button className="btn primary" onClick={save}>Сохранить расписание</button>
        <span className="muted">{msg}</span>
      </div>
    </div>
  );
}
