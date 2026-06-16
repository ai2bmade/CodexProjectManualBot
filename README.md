# CodexProjectManualBot

CodexProjectManualBot is a Telegram-first course manual for learning ChatGPT and Codex through small practical lessons.

This project is intentionally not a normal chatbot.

It teaches like a textbook, a cooking recipe, and a step-by-step user manual:

1. show the big picture
2. explain what this lesson is for
3. show the outline
4. give one step at a time
5. wait for the learner to move forward

If a learner asks a question, the bot does not pretend to be a live AI tutor. Instead, it gives a structured prompt the learner can paste into ChatGPT or Codex.

## Teaching Style

- Beginner-first
- Manual-style flow
- One step at a time
- Practical mini-project lessons
- Small wins before advanced features
- Questions are welcome, but answers are redirected into ChatGPT/Codex prompts
- Low operating cost because the bot does not call AI for every message

## Course Shape

- Total lessons: 20
- Free lessons: 2
- Paid lessons after unlock: 18
- Early lessons focus on small Telegram bots
- Later lessons move into planning, documents, deployment, and business automation

Current free lessons:

- Lesson 1: Things To Do Bot
- Lesson 2: Reminder Bot

Example later lessons:

- Expense Tracker Bot
- Daily Journal Bot
- Link Saver Bot
- AI PRD
- Electronic Contract Bot
- Quote and Contract Generator Bot
- Tax and Sales Summary Bot
- Inventory Alert and Reorder Bot
- Meeting to Action Bot
- VPS and Production Deployment

## Product Rules

- Telegram long polling bot
- No web server required
- No public port required
- No domain required
- No OpenAI API key required
- Required environment variable: `TELEGRAM_BOT_TOKEN`
- Optional payment/support link: `BUY_ME_A_COFFEE_URL`
- Optional admin unlock command with `ADMIN_USER_IDS`
- Optional pre-unlocked users with `UNLOCKED_USER_IDS`
- MVP languages: English, Korean, Latin American Spanish
- Coming soon: Brazilian Portuguese, Japanese, French

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

## Learner Flow

What the learner experiences inside Telegram:

1. `/start`
2. choose a language
3. `/lessons`
4. open a lesson with `/lesson 1`
5. read the big picture and outline
6. follow one step
7. move with `/next`
8. repeat with `/repeat`
9. finish with `/done 1`

If the learner asks a question, the bot gives a copy-paste prompt for ChatGPT or Codex.

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

Recommended local test order:

```text
/start
/lessons
/lesson 1
/next
/repeat
/done 1
/status
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
- `/next`: move to the next lesson step
- `/repeat`: repeat the current lesson step
- `/done 1`: mark a lesson complete
- `/status`: show progress
- `/unlock`: show unlock information
- `/help`: show help
- `/unlock_user USER_ID`: admin-only manual unlock

## What This Bot Is Not

- It is not a general-purpose AI chatbot
- It is not a support bot that answers everything directly
- It is not a high-token-cost tutoring system
- It is not trying to replace ChatGPT or Codex

Its job is to keep the course structure simple and guide the learner one step at a time.

## Data Files

Runtime data is stored in `data/`:

- `data/users.json`
- `data/progress.json`
- `data/unlocked_users.json`
- `data/lesson_state.json`

These files are ignored by Git.
