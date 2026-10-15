import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rank } from './matching.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');
const SECRET = process.env.JWT_SECRET || 'skillswap-local-dev-secret-change-this';
const DEMO = process.env.DEMO_MODE !== 'false';
const PRICE = 10, BONUS = 30, PENALTY = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));

const blank = () => ({ nextId: 1, users: [], skills: [], userSkills: [], goals: [], availability: [], wallets: [], transactions: [], sessions: [], matches: [], reviews: [] });
let data = blank();
let writeQueue = Promise.resolve();
async function loadData() {
  try { data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; await saveData(); }
  for (const key of Object.keys(blank())) if (!Array.isArray(data[key]) && key !== 'nextId') data[key] = [];
  if (!Number.isInteger(data.nextId)) data.nextId = 1;
}
function saveData() {
  writeQueue = writeQueue.then(() => fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2)));
  return writeQueue;
}
const id = () => data.nextId++;
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sign = (uid) => jwt.sign({ id: uid }, SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => { try { req.uid = Number(jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET).id); next(); } catch { res.status(401).json({ error: 'Требуется авторизация' }); } };
const byId = (arr, value) => arr.find((x) => Number(x.id) === Number(value));
const skillByName = (name) => data.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
function profile(uid) {
  const u = byId(data.users, uid); if (!u) fail(401, 'Пользователь не найден');
  return { id:u.id, name:u.name, email:u.email, bio:u.bio || '', format:u.format || 'any', skills:data.userSkills.filter(x=>x.user_id===uid).map(x=>({id:x.skill_id,name:byId(data.skills,x.skill_id)?.name,level:x.level})).filter(x=>x.name).sort((a,b)=>a.name.localeCompare(b.name)), goals:data.goals.filter(x=>x.user_id===uid).map(x=>({id:x.skill_id,name:byId(data.skills,x.skill_id)?.name,level:x.level})).filter(x=>x.name).sort((a,b)=>a.name.localeCompare(b.name)), availability:data.availability.filter(x=>x.user_id===uid).map(({day,hour})=>({day,hour})) };
}
function addTransaction(uid, amount, type, note, session_id=null) { data.transactions.push({id:id(),user_id:uid,session_id,amount,type,note,created_at:new Date().toISOString()}); }
function getWallet(uid) { let w=data.wallets.find(x=>x.user_id===uid); if(!w){w={user_id:uid,balance:BONUS,reserved:0};data.wallets.push(w);addTransaction(uid,BONUS,'bonus','Стартовый бонус');} return w; }
function nextDate(day,hour) { const d=new Date(); d.setDate(d.getDate()+((day-((d.getDay()+6)%7)+7)%7)); d.setHours(hour,0,0,0); if(d<=new Date())d.setDate(d.getDate()+7); return d.toISOString(); }
function getUserPublic(uid) { const u=byId(data.users,uid); if(!u)return null; return {id:u.id,name:u.name,bio:u.bio||'',format:u.format||'any'}; }

app.post('/api/auth/register', wrap(async(req,res)=>{
 const {name='',email='',password=''}=req.body; const errors=[];
 if(name.trim().length<2)errors.push('Имя — минимум 2 символа'); if(!EMAIL_RE.test(email))errors.push('Некорректный email'); if(password.length<6)errors.push('Пароль — минимум 6 символов'); if(errors.length)fail(400,errors.join('. '));
 const normalized=email.toLowerCase(); if(data.users.some(u=>u.email===normalized))fail(409,'Этот email уже зарегистрирован');
 const uid=id(); data.users.push({id:uid,name:name.trim(),email:normalized,password_hash:await bcrypt.hash(password,10),bio:'',format:'any'}); data.wallets.push({user_id:uid,balance:BONUS,reserved:0}); addTransaction(uid,BONUS,'bonus','Стартовый бонус'); await saveData(); res.json({token:sign(uid),user:{id:uid,name:name.trim(),email:normalized}});
}));
app.post('/api/auth/login',wrap(async(req,res)=>{const {email='',password=''}=req.body;if(!EMAIL_RE.test(email)||!password)fail(400,'Введите email и пароль');const u=data.users.find(x=>x.email===email.toLowerCase());if(!u||!(await bcrypt.compare(password,u.password_hash)))fail(401,'Неверный email или пароль');res.json({token:sign(u.id),user:{id:u.id,name:u.name,email:u.email}});}));
app.get('/api/me',auth,wrap(async(req,res)=>res.json(profile(req.uid))));
app.put('/api/me',auth,wrap(async(req,res)=>{const {name='',bio='',format='any'}=req.body;if(name.trim().length<2)fail(400,'Имя — минимум 2 символа');if(!['any','online','offline'].includes(format))fail(400,'Неверный формат');const u=byId(data.users,req.uid);u.name=name.trim();u.bio=String(bio).slice(0,500);u.format=format;await saveData();res.json(profile(req.uid));}));
app.get('/api/skills',wrap(async(req,res)=>res.json([...data.skills].sort((a,b)=>a.name.localeCompare(b.name)))));
app.post('/api/skills',auth,wrap(async(req,res)=>{const name=String(req.body.name||'').trim();if(name.length<2||name.length>60)fail(400,'Название навыка: 2–60 символов');let s=skillByName(name);if(!s){s={id:id(),name};data.skills.push(s);await saveData();}res.json(s);}));
for(const [route,key] of [['skills','userSkills'],['goals','goals']]){
 app.put(`/api/me/${route}`,auth,wrap(async(req,res)=>{const skill_id=Number(req.body.skill_id),level=Number(req.body.level);if(!skill_id||![1,2,3].includes(level))fail(400,'Укажите навык и уровень');if(!byId(data.skills,skill_id))fail(404,'Навык не найден');let item=data[key].find(x=>x.user_id===req.uid&&x.skill_id===skill_id);if(item)item.level=level;else data[key].push({user_id:req.uid,skill_id,level});await saveData();res.json(profile(req.uid));}));
 app.delete(`/api/me/${route}/:id`,auth,wrap(async(req,res)=>{data[key]=data[key].filter(x=>!(x.user_id===req.uid&&x.skill_id===Number(req.params.id)));await saveData();res.json(profile(req.uid));}));
}
app.put('/api/me/availability',auth,wrap(async(req,res)=>{if(!Array.isArray(req.body.slots)||req.body.slots.length>168)fail(400,'Некорректное расписание');const slots=req.body.slots.filter(s=>Number(s.day)>=0&&Number(s.day)<=6&&Number(s.hour)>=0&&Number(s.hour)<=23).map(s=>({user_id:req.uid,day:Number(s.day),hour:Number(s.hour)}));data.availability=data.availability.filter(x=>x.user_id!==req.uid);for(const s of slots)if(!data.availability.some(x=>x.user_id===s.user_id&&x.day===s.day&&x.hour===s.hour))data.availability.push(s);await saveData();res.json(profile(req.uid));}));
app.get('/api/match',auth,wrap(async(req,res)=>{const skillId=Number(req.query.skill_id);if(!skillId)fail(400,'Выберите навык');const goal=data.goals.find(x=>x.user_id===req.uid&&x.skill_id===skillId);const goalLevel=Number(req.query.level)||goal?.level||1;const me=byId(data.users,req.uid);const candidates=data.userSkills.filter(x=>x.skill_id===skillId&&x.user_id!==req.uid).map(us=>{const u=byId(data.users,us.user_id);const reviews=data.reviews.filter(r=>r.teacher_id===us.user_id&&r.skill_id===skillId);const done=data.sessions.filter(s=>s.teacher_id===us.user_id&&s.skill_id===skillId&&s.status==='completed').length;return{id:u.id,name:u.name,bio:u.bio,format:u.format,level:us.level,rating:reviews.length?reviews.reduce((a,r)=>a+r.rating,0)/reviews.length:null,reviews:reviews.length,done};});const ids=candidates.map(c=>c.id);const avail=data.availability.filter(a=>ids.includes(a.user_id)).map(a=>({user_id:a.user_id,day:a.day,hour:a.hour}));const myAvail=data.availability.filter(a=>a.user_id===req.uid);const mutual=new Set(data.goals.filter(g=>ids.includes(g.user_id)&&data.userSkills.some(us=>us.user_id===req.uid&&us.skill_id===g.skill_id)).map(g=>g.user_id));res.json(rank({candidates,avail,myAvail,myFormat:me.format,goalLevel,mutual}));}));
app.get('/api/users/:id',auth,wrap(async(req,res)=>{const uid=Number(req.params.id),user=getUserPublic(uid);if(!user)fail(404,'Студент не найден');const skills=data.userSkills.filter(x=>x.user_id===uid).map(us=>{const rs=data.reviews.filter(r=>r.teacher_id===uid&&r.skill_id===us.skill_id);return{id:us.skill_id,name:byId(data.skills,us.skill_id)?.name,level:us.level,rating:rs.length?rs.reduce((a,r)=>a+r.rating,0)/rs.length:null,reviews:rs.length,done:data.sessions.filter(s=>s.teacher_id===uid&&s.skill_id===us.skill_id&&s.status==='completed').length};}).filter(s=>s.name);const reviews=data.reviews.filter(r=>r.teacher_id===uid).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,20).map(r=>({...r,author:byId(data.users,r.author_id)?.name||'Студент',skill:byId(data.skills,r.skill_id)?.name||''}));const mine=new Set(data.availability.filter(a=>a.user_id===req.uid).map(a=>a.day*24+a.hour));const shared=data.availability.filter(a=>a.user_id===uid&&mine.has(a.day*24+a.hour)).map(({day,hour})=>({day,hour})).sort((a,b)=>a.day-b.day||a.hour-b.hour);res.json({user,skills,reviews,shared});}));
app.get('/api/sessions',auth,wrap(async(req,res)=>{res.json(data.sessions.filter(s=>s.teacher_id===req.uid||s.learner_id===req.uid).sort((a,b)=>b.starts_at.localeCompare(a.starts_at)).map(s=>({...s,skill:byId(data.skills,s.skill_id)?.name||'',teacher_name:byId(data.users,s.teacher_id)?.name||'',learner_name:byId(data.users,s.learner_id)?.name||'',reviewed:data.reviews.some(r=>r.session_id===s.id)})));}));
app.post('/api/sessions',auth,wrap(async(req,res)=>{const {teacher_id,skill_id,day,hour,score}=req.body;const teacher=Number(teacher_id),skill=Number(skill_id),d=Number(day),h=Number(hour);if(![teacher,skill,d,h].every(Number.isInteger)||d<0||d>6||h<0||h>23||teacher<=0||skill<=0)fail(400,'Некорректные параметры занятия');if(teacher===req.uid)fail(400,'Нельзя записаться к самому себе');if(!data.userSkills.some(x=>x.user_id===teacher&&x.skill_id===skill))fail(400,'Студент не преподаёт этот навык');const has=(uid)=>data.availability.some(a=>a.user_id===uid&&a.day===d&&a.hour===h);if(!has(teacher)||!has(req.uid))fail(400,'Это время не подходит обоим');const starts=nextDate(d,h);if(data.sessions.some(s=>s.status==='booked'&&s.starts_at===starts&&[s.teacher_id,s.learner_id].some(uid=>[teacher,req.uid].includes(uid))))fail(409,'Это время уже занято');const w=getWallet(req.uid);if(w.balance-w.reserved<PRICE)fail(400,`Недостаточно SkillPoints (нужно ${PRICE} SP)`);w.reserved+=PRICE;const sessionId=id();data.matches.push({id:id(),learner_id:req.uid,teacher_id:teacher,skill_id:skill,score:Math.min(100,Math.max(0,Number(score)||0))});data.sessions.push({id:sessionId,teacher_id:teacher,learner_id:req.uid,skill_id:skill,starts_at:starts,price:PRICE,status:'booked',teacher_confirmed:false,learner_confirmed:false});await saveData();res.json({ok:true});}));
app.post('/api/sessions/:id/confirm',auth,wrap(async(req,res)=>{const s=byId(data.sessions,req.params.id);if(!s||![s.teacher_id,s.learner_id].includes(req.uid))fail(404,'Занятие не найдено');if(s.status!=='booked')fail(400,'Занятие уже не активно');if(!DEMO&&new Date(s.starts_at)>new Date())fail(400,'Подтвердить можно только после начала занятия');if(req.uid===s.teacher_id)s.teacher_confirmed=true;else s.learner_confirmed=true;if(s.teacher_confirmed&&s.learner_confirmed){s.status='completed';const learner=getWallet(s.learner_id),teacher=getWallet(s.teacher_id);learner.balance-=s.price;learner.reserved=Math.max(0,learner.reserved-s.price);teacher.balance+=s.price;addTransaction(s.learner_id,-s.price,'spend','Занятие у другого студента',s.id);addTransaction(s.teacher_id,s.price,'earn','Проведённое занятие',s.id);}await saveData();res.json({ok:true});}));
app.post('/api/sessions/:id/cancel',auth,wrap(async(req,res)=>{const s=byId(data.sessions,req.params.id);if(!s||![s.teacher_id,s.learner_id].includes(req.uid))fail(404,'Занятие не найдено');if(s.status!=='booked')fail(400,'Занятие уже не активно');s.status='cancelled';const w=getWallet(s.learner_id);w.reserved=Math.max(0,w.reserved-s.price);const late=new Date(s.starts_at)>new Date()&&new Date(s.starts_at)-new Date()<2*3600*1000;if(late&&req.uid===s.learner_id){w.balance-=PENALTY;getWallet(s.teacher_id).balance+=PENALTY;addTransaction(s.learner_id,-PENALTY,'penalty','Штраф за позднюю отмену',s.id);addTransaction(s.teacher_id,PENALTY,'earn','Компенсация за позднюю отмену',s.id);}await saveData();res.json({ok:true});}));
app.post('/api/sessions/:id/review',auth,wrap(async(req,res)=>{const s=byId(data.sessions,req.params.id),rating=Number(req.body.rating);if(!(rating>=1&&rating<=5))fail(400,'Оценка от 1 до 5');if(!s||s.learner_id!==req.uid)fail(403,'Отзыв может оставить только ученик');if(s.status!=='completed')fail(400,'Отзыв — только после завершённого занятия');if(data.reviews.some(r=>r.session_id===s.id))fail(409,'Отзыв уже оставлен');data.reviews.push({id:id(),session_id:s.id,author_id:req.uid,teacher_id:s.teacher_id,skill_id:s.skill_id,rating,comment:String(req.body.comment||'').slice(0,500),created_at:new Date().toISOString()});await saveData();res.json({ok:true});}));
app.get('/api/wallet',auth,wrap(async(req,res)=>{const w=getWallet(req.uid);const history=data.transactions.filter(t=>t.user_id===req.uid).sort((a,b)=>b.id-a.id).slice(0,50).map(({id,amount,type,note,created_at})=>({id,amount,type,note,created_at}));res.json({...w,available:w.balance-w.reserved,history});}));
app.get('/api/health',(req,res)=>res.json({ok:true,storage:'json-file'}));
app.use((err,req,res,next)=>{if(!err.status)console.error(err);res.status(err.status||500).json({error:err.status?err.message:'Ошибка сервера'});});
loadData().then(()=>app.listen(process.env.PORT||4000,()=>console.log('SkillSwap API: http://localhost:'+(process.env.PORT||4000)+' | storage: server/data.json'))).catch(e=>{console.error('Не удалось загрузить server/data.json',e);process.exit(1);});
