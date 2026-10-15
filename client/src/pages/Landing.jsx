import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Landing() {
  const { user } = useSelector((s) => s.auth);
  return (
    <div className="wrap hero">
      <div>
        <span className="pill"><i className="dot" /> <b>100% взаимопомощь</b> · учись у сокурсников без платных курсов</span>
        <h1>Меняйся знаниями,<br /><span className="grad">расти вместе</span><br />со студентами!</h1>
        <p className="lead">Покажи, что умеешь, и укажи, что хочешь изучить. SkillSwap подберёт партнёра, найдёт общее время, а внутренние баллы SkillPoints позволят обмениваться знаниями даже без прямой пары.</p>
        <div className="row">
          <Link className="btn primary lg" to={user ? '/match' : '/auth'}>{user ? 'Найти партнёра' : 'Начать бесплатно'}</Link>
          {!user && <Link className="btn ghost lg" to="/auth">Войти</Link>}
        </div>
        <div className="stats">
          <div><b>35%</b><span>важность навыка</span></div>
          <div><b>10 SP</b><span>за час занятия</span></div>
          <div><b>5</b><span>критериев мэтчинга</span></div>
        </div>
      </div>
      <div className="demo">
        <span className="demo-tag">⚡ ТОП-ОБМЕН</span>
        <div className="row"><div className="ava big">А</div><div><b>Алия</b><div className="soft">Python · Продвинутый</div></div><span className="rate">4.9 ★</span></div>
        <div className="demo-box"><div className="soft">Ближайшее занятие:</div><b className="yellow">Сегодня в 18:00</b><p>Тема: основы Python — функции и циклы</p></div>
        <div className="demo-box"><span className="soft">Баланс</span> <b className="yellow">30 SP</b> &nbsp; <span className="soft">+10 SP за проведённый час</span></div>
      </div>
    </div>
  );
}
