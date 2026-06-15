# CodexProjectManualBot

Telegram-first manual for learning Codex by building 20 small bots and apps.

This bot is designed for beginners. It explains the early setup slowly, answers common questions, and keeps the learner's lesson history inside Telegram.

## Features

- Telegram long polling bot
- No web server
- No public port required
- No domain required
- No OpenAI API key required
- Required environment variable: `TELEGRAM_BOT_TOKEN`
- Optional payment/support link: `BUY_ME_A_COFFEE_URL`
- Optional admin unlock command with `ADMIN_USER_IDS`
- Optional pre-unlocked users with `UNLOCKED_USER_IDS`
- Lesson 1 and Lesson 2 are free
- Lessons 3-20 are locked until unlock
- Languages in MVP: English, Korean, Latin American Spanish
- Coming soon language choices: Brazilian Portuguese, Japanese, French
- Built-in FAQ answers for beginner questions
- No AI call for every student question, to keep operating cost low
- Fallback answers give students a copy-paste prompt for ChatGPT/Codex

## Coolify Environment Variables

Required:

```text
TELEGRAM_BOT_TOKEN=BotFather token
```

Optional:

```text
BUY_ME_A_COFFEE_URL=https://www.buymeacoffee.com/your-page
ADMIN_USER_IDS=123456789
UNLOCKED_USER_IDS=111111111,222222222
```

`ADMIN_USER_IDS` lets an admin run:

```text
/unlock_user TELEGRAM_USER_ID
```

## Expected Startup Log

```text
Codex Project Manual Bot started with 20 lessons.
```

## Local Run

Install dependencies:

```powershell
npm install
```

Set the token in PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN="your BotFather token"
```

Start:

```powershell
npm start
```

Validate code and content:

```powershell
npm run check
```

## Coolify Deploy

1. Create or open the Coolify project `CodexProjectManualBot`.
2. Connect the GitHub repo `https://github.com/ai2bmade/CodexProjectManualBot`.
3. Use Dockerfile or docker-compose based deployment.
4. Set `TELEGRAM_BOT_TOKEN`.
5. Optional: set `BUY_ME_A_COFFEE_URL`.
6. Optional: set `ADMIN_USER_IDS` to your Telegram numeric user ID.
7. Deploy.
8. Check logs for `Codex Project Manual Bot started with 20 lessons.`
9. Open Telegram and send `/start`.

## Commands

- `/start`: choose language
- `/lessons`: show lesson list
- `/lesson 1`: open a lesson
- `/done 1`: mark a lesson complete
- `/status`: show progress
- `/unlock`: show unlock information
- `/help`: show help
- `/unlock_user USER_ID`: admin-only manual unlock

Students can also send simple questions like:

```text
What is a bot token?
봇 토큰이 뭐야?
Que es un token?
```

The bot answers common beginner questions from `content/faq.json`.

If the bot does not have a prepared answer, it explains that the course is kept inexpensive by avoiding AI calls for every message. Then it gives the student a prompt to paste into ChatGPT or Codex.

## Data Files

Runtime data is stored in `data/`:

- `data/users.json`
- `data/progress.json`
- `data/unlocked_users.json`

These files are ignored by Git.
