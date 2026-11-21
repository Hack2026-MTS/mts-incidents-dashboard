# Структура проекта Hack2026

Краткое описание всех файлов монорепозитория:

---

### Корень проекта
* `docker-compose.yml` — конфигурация развертывания PostgreSQL и сервиса в Docker.
* `README.md` — главное руководство по проекту, архитектуре, моделям и быстрому запуску.

---

### `data/` — Исходные данные
* `data/character_problems.json` — исходный датасет с 44 инцидентами ITSM.
* `data/incidents_attributes.json` — справочник и описание всех полей инцидентов.

---

### `backend/` — Микросервис на Go
* `backend/Dockerfile` — многоэтапная сборка легковесного контейнера бэкенда и фронтенда.
* `backend/go.mod` — манифест Go-модуля и список внешних библиотек.
* `backend/go.sum` — контрольные суммы зависимостей Go.
* `backend/cmd/server/main.go` — точка входа сервера, запуск БД, сидинга, API и SSE на порту 8080.
* `backend/internal/api/router.go` — настройка роутинга Chi, CORS и раздачи статики фронтенда.
* `backend/internal/api/incidents.go` — REST-обработчики инцидентов (`GET`, `POST`, `PUT`, статистика).
* `backend/internal/api/sse.go` — брокер Server-Sent Events (SSE) для рассылки апдейтов в реальном времени.
* `backend/internal/api/demo.go` — обработчики тестовых сценариев (авария KION, назначение, решение, сброс).
* `backend/internal/database/db.go` — пул соединений PostgreSQL, выполнение запросов и сидинг.
* `backend/internal/database/schema.sql` — DDL-схема таблиц `incidents` и `incident_events`.
* `backend/internal/ml/engine.go` — нативный Go-движок инференса риска эскалации и маршрутизации.
* `backend/internal/models/incident.go` — Go-структуры моделей инцидента, SSE-сообщений и метрик.

---

### `backend/models_ai/` — Модели машинного обучения
* `backend/models_ai/risk_assessment.onnx` — скомпилированная ONNX-модель оценки риска эскалации.
* `backend/models_ai/risk_assessment_model.json` — веса, пороги и ключевые слова для модели риска.
* `backend/models_ai/routing_hint.onnx` — скомпилированная ONNX-модель умной маршрутизации по командам.
* `backend/models_ai/routing_hint_model.json` — TF-IDF словарь, веса и классы команд для роутинга.

---

### `ml/` — Обучение моделей
* `ml/train_and_export.py` — Python-скрипт обучения моделей на датасете и их экспорта в ONNX и JSON.

---

### `frontend/` — Пользовательский интерфейс (React + TS + Vite)
* `frontend/package.json` — зависимости фронтенда (React 19, Lucide, Tailwind).
* `frontend/vite.config.ts` — конфиг сборщика Vite с плагином Tailwind CSS и прокси на `:8080`.
* `frontend/tsconfig.json` — базовый конфиг компилятора TypeScript.
* `frontend/index.html` — корневой HTML-шаблон страницы дашборда.
* `frontend/dist/` — готовый скомпилированный продакшн-бандл (раздается бэкендом).
* `frontend/src/main.tsx` — точка входа React-приложения.
* `frontend/src/App.tsx` — главное состояние дашборда, подписка на SSE и раскладка 4 колонок.
* `frontend/src/index.css` — глобальные стили и директивы Tailwind CSS.
* `frontend/src/types/incident.ts` — TypeScript-типы инцидентов, статистики и сообщений SSE.
* `frontend/src/services/api.ts` — функции работы с REST API бэкенда и демо-эндпоинтами.
* `frontend/src/services/sse.ts` — сервис поддержания живого SSE-соединения с автопереподключением.
* `frontend/src/utils/audio.ts` — аудио-синтезатор сирен и оповещений через Web Audio API.

#### Компоненты (`frontend/src/components/`):
* `frontend/src/components/Header.tsx` — компактная шапка со статусом LIVE, поиском и тикером метрик.
* `frontend/src/components/ColumnGroup.tsx` — колонка одной из 4 групп инцидентов со своим скроллом.
* `frontend/src/components/IncidentCard.tsx` — карточка инцидента с таймером SLA, подсказкой ИИ и кнопкой передачи.
* `frontend/src/components/IncidentDetailModal.tsx` — модальное окно деталей инцидента и ссылки в ITSM.
* `frontend/src/components/AlertToast.tsx` — всплывающие тосты оповещений о новых событиях.
* `frontend/src/components/DemoPanel.tsx` — выдвижная плавающая панель запуска демонстрационных сценариев.

---

### `docs/` — Документация проекта
* `docs/demo_simulation.md` — подробное описание механики работы демо-симуляции событий.
* `docs/ai_trigger_events.md` — описание событий и триггеров запуска анализа ИИ.
* `docs/how_ai_learns_from_db.md` — как ИИ обучается на данных БД и знает команды/продукты МТС.
* `docs/ai_predictions_tracking.md` — таблица ai_predictions: сбор обратной связи и датасет дообучения.
* `docs/sla_prediction_model.md` — модель прогнозирования риска срыва SLA с учетом загрузки команд и MTTR.
* `docs/project_structure.md` — текущий документ со структурой всех файлов проекта.
