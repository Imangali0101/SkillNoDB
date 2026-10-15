import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authenticate } from '../store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = [];
    if (mode === 'register' && f.name.trim().length < 2) errs.push('Имя — минимум 2 символа');
    if (!EMAIL_RE.test(f.email)) errs.push('Введите корректный email');
    if (f.password.length < 6) errs.push('Пароль — минимум 6 символов');
    setErrors(errs);
    if (errs.length) return;
    setBusy(true);
    try {
      await dispatch(authenticate({ mode, ...f })).unwrap();
      nav('/profile');
    } catch (err) {
      setErrors([err.message]);
    } finally { setBusy(false); }
  };

  return (
    <div className="wrap narrow pad">
      <form className="card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
        {mode === 'register' && <label>Имя<input value={f.name} onChange={set('name')} placeholder="Алия" /></label>}
        <label>Email<input value={f.email} onChange={set('email')} placeholder="you@mail.com" /></label>
        <label>Пароль<input type="password" value={f.password} onChange={set('password')} placeholder="минимум 6 символов" /></label>
        {errors.map((x) => <p key={x} className="err">{x}</p>)}
        <button className="btn primary lg full" disabled={busy}>{mode === 'login' ? 'Войти' : 'Создать аккаунт (+30 SP)'}</button>
        <p className="muted center">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setErrors([]); }}>
            {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </a>
        </p>
      </form>
    </div>
  );
}
