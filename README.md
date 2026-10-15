# SkillSwap — биржа навыков между студентами

Стек: React + Vite + Redux Toolkit · Node.js + Express · JSON-файл для хранения данных. PostgreSQL не нужен.

## Запуск на macOS
1. Установите Node.js (если ещё не установлен).
2. В корне проекта выполните:
   ```bash
   npm install
   npm run setup
   npm run seed   # необязательно: демо-студенты, пароль у всех demo123
   npm run dev
   ```
3. Откройте http://localhost:5173. API работает на http://localhost:4000.

Данные backend сохраняются в `server/data.json` и остаются после перезапуска. JWT-токен хранится в `localStorage` браузера. Отдельный PostgreSQL и файл `.env` не требуются для локального запуска.

## SkillPoints
- Стартовый бонус 30 SP.
- 1 час занятия = 10 SP.
- При бронировании баллы резервируются; переводятся после подтверждения обеими сторонами.
- `DEMO_MODE=true` позволяет подтверждать занятия до начала для проверки.

## Демо-аккаунты
`aliya@demo.kz`, `timur@demo.kz`, `madina@demo.kz`, `daniyar@demo.kz`, `alina@demo.kz`, `ruslan@demo.kz`. Пароль: `demo123`.
# SkillSwap
