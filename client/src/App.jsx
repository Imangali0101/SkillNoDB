import { useEffect } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, logout } from './store';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Match from './pages/Match';
import Teacher from './pages/Teacher';
import Sessions from './pages/Sessions';
import Wallet from './pages/Wallet';

function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const nav = useNavigate();
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link to="/" className="logo"><span className="logo-ic">⇄</span><b>Skill<em>Swap</em></b></Link>
        {user && (
          <nav>
            <NavLink to="/match">Найти партнёра</NavLink>
            <NavLink to="/sessions">Занятия</NavLink>
            <NavLink to="/wallet">SkillPoints</NavLink>
            <NavLink to="/profile">Профиль</NavLink>
          </nav>
        )}
        <div className="row">
          {user ? (
            <>
              <span className="chip user-chip">{user.name}</span>
              <button className="btn ghost" onClick={() => { dispatch(logout()); nav('/'); }}>Выйти</button>
            </>
          ) : (
            <Link className="btn ghost" to="/auth">Войти</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Private({ children }) {
  const { user, loading } = useSelector((s) => s.auth);
  if (loading) return <div className="wrap muted pad">Загрузка…</div>;
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => { if (localStorage.getItem('token')) dispatch(fetchMe()); }, [dispatch]);
  const P = (el) => <Private>{el}</Private>;
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={P(<Profile />)} />
          <Route path="/match" element={P(<Match />)} />
          <Route path="/teacher/:id" element={P(<Teacher />)} />
          <Route path="/sessions" element={P(<Sessions />)} />
          <Route path="/wallet" element={P(<Wallet />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
