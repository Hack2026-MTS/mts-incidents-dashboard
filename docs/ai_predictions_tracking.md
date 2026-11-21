# Таблица `ai_predictions`: Сбор обратной связи и датасет для дообучения

В соответствии с лучшими практиками **MLOps и Active Learning**, все предсказания моделей искусственного интеллекта отделены от журнала системных логов (`incident_events`) и регистрируются в специализированной таблице: **`ai_predictions`**.

Эта таблица формирует замкнутый контур обратной связи (**Feedback Loop**): она сопоставляет, **что предсказал ИИ**, с тем, **какое реальное решение принял дежурный координатор**.

---

## 1. Схема таблицы в PostgreSQL

```sql
CREATE TABLE IF NOT EXISTS ai_predictions (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    -- Что предсказал ИИ:
    predicted_group VARCHAR(255),
    confidence DOUBLE PRECISION,
    top_candidates JSONB,
    predicted_risk_score DOUBLE PRECISION,
    predicted_risk_level VARCHAR(32),
    input_features JSONB,             -- Полный слепок полей (текст, сервис, приоритет)
    
    -- Что в реальности сделал координатор (обратная связь):
    actual_group VARCHAR(255),        -- Реальная выбранная команда
    is_accepted BOOLEAN,              -- Согласился ли координатор с ИИ? (true/false)
    
    -- Временные метки:
    created_at TIMESTAMPTZ DEFAULT NOW(),   -- Момент выдачи подсказки ИИ
    evaluated_at TIMESTAMPTZ                -- Момент решения координатора
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_incident_id ON ai_predictions (incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_is_accepted ON ai_predictions (is_accepted);
```

---

## 2. Как работает жизненный цикл записи

### Шаг 1. ИИ делает прогноз
Когда инцидент поступает в очередь координаторов:
1. Модель вычисляет рекомендацию команды и скоринг риска.
2. В `ai_predictions` создается новая запись:
   * `predicted_group`: *«КЦ ДОИ Администрирование SAN»*
   * `confidence`: `98.0%`
   * `top_candidates`: `[{"group": "...", "confidence": 21.2}, ...]`
   * `input_features`: снимок заголовка, описания, продукта и сервиса.
   * `actual_group`: `NULL` *(решение еще не принято)*
   * `is_accepted`: `NULL`

### Шаг 2. Координатор принимает решение
Координатор видит карточку на дашборде:
* **Вариант А (Координатор согласился):** нажал кнопку «Передать в КЦ ДОИ Администрирование SAN».
  Система делает `UPDATE`:
  * `actual_group` = *«КЦ ДОИ Администрирование SAN»*
  * `is_accepted` = `true`
  * `evaluated_at` = `NOW()`
* **Вариант Б (Координатор исправил ИИ):** открыл карточку и вручную назначил *«ОГЭ Приморье»*.
  Система делает `UPDATE`:
  * `actual_group` = *«ОГЭ Приморье»*
  * `is_accepted` = `false` *(зафиксирована ошибка ИИ)*
  * `evaluated_at` = `NOW()`

---

## 3. Как эти данные используются для дообучения моделей

Таблица `ai_predictions` решает главную проблему промышленного ML — накопление качественной разметки:

1. **Расчет реальной метрики Accuracy в проде:**
   ```sql
   SELECT 
       COUNT(*) AS total_recommendations,
       COUNT(*) FILTER (WHERE is_accepted = true) AS accepted_count,
       ROUND(COUNT(*) FILTER (WHERE is_accepted = true) * 100.0 / COUNT(*), 2) AS accuracy_percent
   FROM ai_predictions
   WHERE evaluated_at IS NOT NULL;
   ```
2. **Анализ сложных кейсов (Hard Negatives):**
   Инженеры ML могут сделать выборку всех случаев, где `is_accepted = false`:
   ```sql
   SELECT incident_id, input_features, predicted_group, actual_group 
   FROM ai_predictions 
   WHERE is_accepted = false;
   ```
   Это показывает, на каких формулировках или сервисах модель ошибается чаще всего.
3. **Автоматическое дообучение:**
   Скрипт переобучения забирает из таблицы пары `(input_features ➔ actual_group)`, объединяет их с исходным датасетом и переобучает классификатор. Модель непрерывно учится на опыте живых координаторов.
