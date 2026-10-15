import { useEffect, useState } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils';

export default function Wallet() {
  const [w, setW] = useState(null);
  useEffect(() => { api('/wallet').then(setW); }, []);
  if (!w) return <div className="wrap pad muted">Загрузка…</div>;
  return (
    <div className="wrap pad">
      <h2>SkillPoints</h2>
      <div className="three">
        <div className="card stat"><span className="muted">Баланс</span><b className="yellow">{w.balance} SP</b></div>
        <div className="card stat"><span className="muted">В резерве</span><b>{w.reserved} SP</b></div>
        <div className="card stat"><span className="muted">Доступно</span><b>{w.available} SP</b></div>
      </div>
      <div className="card">
        <h3>История операций</h3>
        {w.history.length === 0 && <p className="muted">Операций пока нет</p>}
        {w.history.map((t) => (
          <div key={t.id} className="tx">
            <span>{t.note}<br /><span className="muted sm">{fmtDate(t.created_at)}</span></span>
            <b className={t.amount > 0 ? 'pos' : 'neg'}>{t.amount > 0 ? '+' : ''}{t.amount} SP</b>
          </div>
        ))}
      </div>
    </div>
  );
}
