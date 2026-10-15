export const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const LEVELS = { 1: 'Начальный', 2: 'Средний', 3: 'Продвинутый' };
export const FORMATS = { any: 'Любой', online: 'Онлайн', offline: 'Офлайн' };
export const STATUS = { booked: 'Запланировано', completed: 'Завершено', cancelled: 'Отменено' };
export const fmtSlot = (s) => `${DAYS[s.day]} ${String(s.hour).padStart(2, '0')}:00`;
export const fmtDate = (d) => new Date(d).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const initials = (n = '') => n.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
