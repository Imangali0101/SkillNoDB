import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');
let db;
try { db = JSON.parse(await fs.readFile(file, 'utf8')); } catch { db = { nextId: 1, users: [], skills: [], userSkills: [], goals: [], availability: [], wallets: [], transactions: [], sessions: [], matches: [], reviews: [] }; }
for (const k of ['users','skills','userSkills','goals','availability','wallets','transactions','sessions','matches','reviews']) db[k] ||= [];
const nextId=()=>db.nextId++;
const skills=['Python','SQL','Английский','Математика','Шахматы','Дизайн (Figma)','JavaScript','Гитара','Казахский','Excel'];
for(const name of skills)if(!db.skills.some(s=>s.name===name))db.skills.push({id:nextId(),name});
const slots={evening:[[0,1,2,3,4],[18,19,20,21]],day:[[0,1,2,3,4],[12,13,14,15,16]],weekend:[[5,6],[10,11,12,13,14,15,16,17]]};
const demos=[['Алия','aliya@demo.kz',[['Python',3],['SQL',2]],[['Английский',1]],['evening','weekend'],'any'],['Тимур','timur@demo.kz',[['Английский',3]],[['Python',1]],['evening'],'online'],['Мадина','madina@demo.kz',[['Математика',3],['Шахматы',2]],[['Python',1]],['day','evening'],'any'],['Данияр','daniyar@demo.kz',[['Дизайн (Figma)',2],['Английский',2]],[['Математика',2]],['weekend'],'offline'],['Алина','alina@demo.kz',[['JavaScript',3],['Python',2]],[['Дизайн (Figma)',1]],['evening','day'],'any'],['Руслан','ruslan@demo.kz',[['Гитара',3],['Казахский',3]],[['Excel',1]],['evening'],'offline']];
const hash=await bcrypt.hash('demo123',10);
for(const [name,email,teaches,wants,times,format] of demos){if(db.users.some(u=>u.email===email))continue;const uid=nextId();db.users.push({id:uid,name,email,password_hash:hash,bio:'',format});db.wallets.push({user_id:uid,balance:30,reserved:0});db.transactions.push({id:nextId(),user_id:uid,session_id:null,amount:30,type:'bonus',note:'Стартовый бонус',created_at:new Date().toISOString()});for(const [n,level] of teaches){const s=db.skills.find(x=>x.name===n);db.userSkills.push({user_id:uid,skill_id:s.id,level});}for(const [n,level] of wants){const s=db.skills.find(x=>x.name===n);db.goals.push({user_id:uid,skill_id:s.id,level});}for(const t of times)for(const day of slots[t][0])for(const hour of slots[t][1])db.availability.push({user_id:uid,day,hour});}
await fs.writeFile(file,JSON.stringify(db,null,2));
console.log('Демо-аккаунты готовы. Пароль: demo123. Данные записаны в server/data.json');
