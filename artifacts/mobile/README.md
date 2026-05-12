# PlantCare (Expo / Replit)

## Быстрый старт (dev)

1) Установить зависимости (в корне репозитория):

```bash
pnpm install
```

2) Запустить Expo dev-сервер:

```bash
pnpm -C artifacts/mobile dev
```

## Сборка .apk через EAS (cloud build)

### 0) Важно

- `.apk` собирается в облаке EAS, не локально на Replit.
- Для авторизации EAS нужен Expo-аккаунт.
- В проекте настроен профиль `preview`, который собирает именно `apk` (см. `eas.json`).

### 1) Подготовить токен Expo (рекомендуется для Replit)

1) Зайти в Expo аккаунт → создать Access Token.
2) В Replit открыть Secrets и добавить переменную:
   - `EXPO_TOKEN` = `<ваш токен>`

Проверка авторизации:

```bash
pnpm -C artifacts/mobile eas:whoami
```

### 2) Запустить сборку .apk

```bash
pnpm -C artifacts/mobile eas:build:apk
```

Дальше EAS может задать вопросы (первый запуск):
- выбор аккаунта/проекта,
- генерация/привязка Android keystore (если ещё не создан),
- подтверждение настроек.

После старта сборки в выводе будет ссылка на билд и итоговый артефакт `.apk`.

### 3) Типичные проблемы

- Ошибка вида `eas.json is not valid ... installCommand is not allowed`:
  - в новых версиях EAS CLI поле `installCommand` больше не поддерживается в `eas.json`.
  - решение: удалить `installCommand` из всех профилей сборки и зафиксировать pnpm через `packageManager` в `package.json`.

- Нет токена/не залогинены:
  - добавьте `EXPO_TOKEN` в Secrets или выполните `pnpm -C artifacts/mobile eas login`.
