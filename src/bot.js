const fs = require("fs");
const path = require("path");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN. Set it in Coolify environment variables.");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${token}`;
const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const UNLOCKED_FILE = path.join(DATA_DIR, "unlocked_users.json");
const CONTENT_FILE = path.join(__dirname, "..", "content", "lessons.json");
const FAQ_FILE = path.join(__dirname, "..", "content", "faq.json");

const content = readJson(CONTENT_FILE);
const faq = readJson(FAQ_FILE);
const supportedLanguages = content.product.supportedLanguages;
const comingSoonLanguages = content.product.comingSoonLanguages;
const freeLessons = new Set(content.product.freeLessons);
const lessonsById = new Map(content.lessons.map((lesson) => [lesson.id, lesson]));
const adminIds = parseIdList(process.env.ADMIN_USER_IDS);
const envUnlockedIds = parseIdList(process.env.UNLOCKED_USER_IDS);

ensureDataFiles();

const text = {
  en: {
    chooseLanguage: "Welcome to Codex 20 Apps Challenge.\n\nChoose your language:",
    languageSaved: "Language saved: English",
    comingSoon: "This language is coming soon. For now, please choose English, Korean, or Latin American Spanish.",
    intro:
      "You will build 20 small Telegram bots and apps with Codex, one lesson at a time.\n\nLessons 1 and 2 are free. The full 20-lesson manual can be unlocked for $3.\n\nTo keep this manual bot inexpensive, it does not call AI for every question. For deeper questions, it gives you a prompt to paste into ChatGPT or Codex.\n\nUse /lessons to begin.",
    lessonsHeader: "Lessons",
    free: "free",
    locked: "locked",
    unlocked: "unlocked",
    useLesson: "Open a lesson with /lesson 1 or /lesson 2.",
    lockedLesson: "This lesson is part of the full 20-lesson manual.\n\nUse /unlock to see how to unlock the remaining lessons.",
    noLesson: "I could not find that lesson. Use /lessons to see the list.",
    unlock: "Lessons 1 and 2 are free.\n\nThe remaining lessons are part of the full Codex 20 Apps Challenge. Unlock all 20 lessons for $3.",
    unlockNoUrl: "The payment link has not been configured yet. Ask the admin to set BUY_ME_A_COFFEE_URL in Coolify.",
    status: "Status",
    language: "Language",
    completed: "Completed",
    available: "Available lessons",
    markedDone: "Lesson marked as completed.",
    doneUsage: "Use /done 1 after finishing a lesson.",
    adminOnly: "This command is only for the bot admin.",
    unlockUserUsage: "Use /unlock_user TELEGRAM_USER_ID",
    userUnlocked: "User unlocked.",
    help:
      "Commands:\n/start - choose language\n/lessons - see all lessons\n/lesson 1 - open a lesson\n/done 1 - mark a lesson complete\n/status - see progress\n/unlock - unlock information\n/help - show this help\n\nYou can also send a simple question, such as \"What is a bot token?\""
  },
  ko: {
    chooseLanguage: "코덱스 20앱 챌린지에 오신 것을 환영합니다.\n\n사용할 언어를 선택하세요:",
    languageSaved: "언어가 저장되었습니다: 한국어",
    comingSoon: "이 언어는 곧 지원될 예정입니다. 지금은 English, 한국어, Español latinoamericano 중에서 선택해주세요.",
    intro:
      "코덱스와 함께 작은 Telegram 봇과 앱 20개를 하나씩 만들어 봅니다.\n\n레슨 1과 2는 무료입니다. 전체 20개 레슨 매뉴얼은 $3로 열 수 있어요.\n\n이 매뉴얼 봇은 저렴하게 운영하기 위해 모든 질문마다 AI를 호출하지 않습니다. 더 깊은 질문은 ChatGPT나 Codex에 붙여넣을 프롬프트를 안내합니다.\n\n/lessons 로 시작하세요.",
    lessonsHeader: "레슨 목록",
    free: "무료",
    locked: "잠김",
    unlocked: "열림",
    useLesson: "/lesson 1 또는 /lesson 2 로 레슨을 열 수 있어요.",
    lockedLesson: "이 레슨은 전체 20개 레슨 매뉴얼에 포함되어 있습니다.\n\n/unlock 으로 나머지 레슨을 여는 방법을 볼 수 있어요.",
    noLesson: "해당 레슨을 찾을 수 없습니다. /lessons 로 목록을 확인하세요.",
    unlock: "레슨 1과 2는 무료입니다.\n\n나머지 레슨은 Codex 20 Apps Challenge 전체 매뉴얼에 포함되어 있습니다. $3로 전체 20개 레슨을 열 수 있어요.",
    unlockNoUrl: "아직 결제 링크가 설정되지 않았습니다. Coolify에서 BUY_ME_A_COFFEE_URL 환경변수를 설정해주세요.",
    status: "상태",
    language: "언어",
    completed: "완료",
    available: "사용 가능한 레슨",
    markedDone: "레슨 완료로 기록했습니다.",
    doneUsage: "레슨을 마친 뒤 /done 1 처럼 입력하세요.",
    adminOnly: "이 명령어는 봇 관리자만 사용할 수 있습니다.",
    unlockUserUsage: "/unlock_user TELEGRAM_USER_ID 형식으로 입력하세요.",
    userUnlocked: "사용자를 언락했습니다.",
    help:
      "명령어:\n/start - 언어 선택\n/lessons - 전체 레슨 보기\n/lesson 1 - 레슨 열기\n/done 1 - 레슨 완료 기록\n/status - 진행 상황 보기\n/unlock - 언락 안내\n/help - 도움말\n\n간단한 질문도 보낼 수 있어요. 예: \"봇 토큰이 뭐야?\""
  },
  es_419: {
    chooseLanguage: "Bienvenido a Codex 20 Apps Challenge.\n\nElige tu idioma:",
    languageSaved: "Idioma guardado: Espanol latinoamericano",
    comingSoon: "Este idioma estara disponible pronto. Por ahora, elige English, Korean o Espanol latinoamericano.",
    intro:
      "Vas a crear 20 bots de Telegram y apps pequenas con Codex, una leccion a la vez.\n\nLas lecciones 1 y 2 son gratis. Puedes desbloquear el manual completo de 20 lecciones por $3.\n\nPara mantener este bot barato, no llama a AI por cada pregunta. Para preguntas mas profundas, te da un prompt para pegar en ChatGPT o Codex.\n\nUsa /lessons para empezar.",
    lessonsHeader: "Lecciones",
    free: "gratis",
    locked: "bloqueada",
    unlocked: "desbloqueada",
    useLesson: "Abre una leccion con /lesson 1 o /lesson 2.",
    lockedLesson: "Esta leccion forma parte del manual completo de 20 lecciones.\n\nUsa /unlock para ver como desbloquear las lecciones restantes.",
    noLesson: "No encontre esa leccion. Usa /lessons para ver la lista.",
    unlock: "Las lecciones 1 y 2 son gratis.\n\nLas demas lecciones forman parte del Codex 20 Apps Challenge completo. Desbloquea las 20 lecciones por $3.",
    unlockNoUrl: "El enlace de pago todavia no esta configurado. Pide al admin que configure BUY_ME_A_COFFEE_URL en Coolify.",
    status: "Estado",
    language: "Idioma",
    completed: "Completadas",
    available: "Lecciones disponibles",
    markedDone: "Leccion marcada como completada.",
    doneUsage: "Usa /done 1 despues de terminar una leccion.",
    adminOnly: "Este comando es solo para el administrador del bot.",
    unlockUserUsage: "Usa /unlock_user TELEGRAM_USER_ID",
    userUnlocked: "Usuario desbloqueado.",
    help:
      "Comandos:\n/start - elegir idioma\n/lessons - ver lecciones\n/lesson 1 - abrir una leccion\n/done 1 - marcar leccion completa\n/status - ver progreso\n/unlock - informacion de desbloqueo\n/help - mostrar ayuda\n\nTambien puedes enviar una pregunta simple, por ejemplo: \"Que es un token?\""
  }
};

main().catch((error) => {
  console.error("Fatal bot error:", error);
  process.exit(1);
});

async function main() {
  await telegram("deleteWebhook", { drop_pending_updates: true });
  console.log(`Codex Project Manual Bot started with ${content.lessons.length} lessons.`);

  let offset = 0;
  while (true) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"]
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error("Polling error:", error.message);
      await sleep(3000);
    }
  }
}

async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  if (!update.message?.text) return;
  await handleMessage(update.message);
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const value = message.text.trim();

  if (value === "/start") return sendLanguageMenu(chatId);
  if (value === "/help") return sendMessage(chatId, t(userId).help);
  if (value === "/lessons") return sendMessage(chatId, buildLessonsMessage(userId));
  if (value === "/status") return sendStatus(chatId, userId);
  if (value === "/unlock") return sendUnlock(chatId, userId);

  let match = value.match(/^\/lesson(?:\s+(\d+))?$/);
  if (match) return sendLesson(chatId, userId, Number(match[1]));

  match = value.match(/^\/done(?:\s+(\d+))?$/);
  if (match) return markDone(chatId, userId, Number(match[1]));

  match = value.match(/^\/unlock_user(?:\s+(\d+))?$/);
  if (match) return unlockUser(chatId, userId, match[1]);

  if (value.startsWith("/")) return sendMessage(chatId, t(userId).help);
  return sendMessage(chatId, findFaqAnswer(value, getUserLanguage(userId)));
}

async function handleCallback(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data || "";

  if (!data.startsWith("lang:")) {
    await answerCallbackQuery(query.id);
    return;
  }

  const lang = data.slice("lang:".length);
  if (comingSoonLanguages.includes(lang)) {
    await answerCallbackQuery(query.id);
    await sendMessage(chatId, text.en.comingSoon);
    return;
  }

  if (!supportedLanguages.includes(lang)) {
    await answerCallbackQuery(query.id);
    return;
  }

  setUserLanguage(userId, lang);
  await answerCallbackQuery(query.id);
  await sendMessage(chatId, `${text[lang].languageSaved}\n\n${text[lang].intro}`);
}

async function sendLanguageMenu(chatId) {
  return sendMessage(chatId, text.en.chooseLanguage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "English", callback_data: "lang:en" },
          { text: "한국어", callback_data: "lang:ko" }
        ],
        [{ text: "Español latinoamericano", callback_data: "lang:es_419" }],
        [
          { text: "Português do Brasil (soon)", callback_data: "lang:pt_BR" },
          { text: "日本語 (soon)", callback_data: "lang:ja" }
        ],
        [{ text: "Français (soon)", callback_data: "lang:fr" }]
      ]
    }
  });
}

async function sendLesson(chatId, userId, lessonId) {
  const copy = t(userId);
  const lang = getUserLanguage(userId);

  if (!lessonId) return sendMessage(chatId, copy.useLesson);

  const lesson = lessonsById.get(lessonId);
  if (!lesson) return sendMessage(chatId, copy.noLesson);
  if (!canAccessLesson(userId, lessonId)) return sendMessage(chatId, copy.lockedLesson);

  for (const message of buildLessonMessages(lesson, lang)) {
    await sendLongMessage(chatId, message);
  }
}

async function markDone(chatId, userId, lessonId) {
  const copy = t(userId);
  if (!lessonId || !lessonsById.has(lessonId)) return sendMessage(chatId, copy.doneUsage);
  if (!canAccessLesson(userId, lessonId)) return sendMessage(chatId, copy.lockedLesson);

  const progress = readJson(PROGRESS_FILE, {});
  const key = String(userId);
  progress[key] ||= { completedLessons: [] };
  if (!progress[key].completedLessons.includes(lessonId)) {
    progress[key].completedLessons.push(lessonId);
    progress[key].completedLessons.sort((a, b) => a - b);
  }
  writeJson(PROGRESS_FILE, progress);
  return sendMessage(chatId, copy.markedDone);
}

async function sendStatus(chatId, userId) {
  const copy = t(userId);
  const lang = getUserLanguage(userId);
  const progress = readJson(PROGRESS_FILE, {});
  const completed = progress[String(userId)]?.completedLessons || [];
  const available = canAccessPaidLessons(userId) ? "1-20" : "1-2";

  return sendMessage(
    chatId,
    `${copy.status}\n${copy.language}: ${content.languages[lang]}\n${copy.completed}: ${completed.length}/20\n${copy.available}: ${available}`
  );
}

async function sendUnlock(chatId, userId) {
  const copy = t(userId);
  const url = process.env.BUY_ME_A_COFFEE_URL;
  const suffix = url ? `\n\n${url}` : `\n\n${copy.unlockNoUrl}`;
  return sendMessage(chatId, `${copy.unlock}${suffix}`);
}

async function unlockUser(chatId, adminUserId, targetUserId) {
  const copy = t(adminUserId);
  if (!adminIds.has(Number(adminUserId))) return sendMessage(chatId, copy.adminOnly);
  if (!targetUserId) return sendMessage(chatId, copy.unlockUserUsage);

  const unlocked = readJson(UNLOCKED_FILE, []);
  if (!unlocked.includes(targetUserId)) {
    unlocked.push(targetUserId);
    writeJson(UNLOCKED_FILE, unlocked);
  }
  return sendMessage(chatId, copy.userUnlocked);
}

function t(userId) {
  return text[getUserLanguage(userId)] || text.en;
}

function getUserLanguage(userId) {
  const users = readJson(USERS_FILE, {});
  return users[String(userId)]?.language || "en";
}

function setUserLanguage(userId, language) {
  const users = readJson(USERS_FILE, {});
  users[String(userId)] ||= {};
  users[String(userId)].language = language;
  writeJson(USERS_FILE, users);
}

function buildLessonsMessage(userId) {
  const lang = getUserLanguage(userId);
  const copy = t(userId);
  const lines = [`${copy.lessonsHeader}\n`];

  for (const lesson of content.lessons) {
    const status = canAccessLesson(userId, lesson.id)
      ? freeLessons.has(lesson.id)
        ? copy.free
        : copy.unlocked
      : copy.locked;
    lines.push(`${lesson.id}. ${lesson.title[lang]} - ${status}`);
  }

  lines.push("", copy.useLesson);
  return lines.join("\n");
}

function buildLessonMessages(lesson, lang) {
  const messages = [`Lesson ${lesson.id}: ${lesson.title[lang]}\n\n${lesson.summary[lang]}`];

  for (const block of lesson.blocks || []) {
    const label = block.type === "prompt" ? "Codex prompt" : "Mission";
    messages.push(`${label}\n\n${block[lang]}`);
  }

  if (lesson.checklist?.[lang]?.length) {
    messages.push(`Checklist\n\n${lesson.checklist[lang].map((item) => `- ${item}`).join("\n")}`);
  }

  return messages;
}

async function sendLongMessage(chatId, message) {
  for (const chunk of splitMessage(message, 3800)) {
    await sendMessage(chatId, chunk);
  }
}

function splitMessage(message, maxLength) {
  if (message.length <= maxLength) return [message];

  const chunks = [];
  let remaining = message;
  while (remaining.length > maxLength) {
    const cut = remaining.lastIndexOf("\n", maxLength);
    const index = cut > 500 ? cut : maxLength;
    chunks.push(remaining.slice(0, index));
    remaining = remaining.slice(index).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function findFaqAnswer(question, lang) {
  const normalizedQuestion = normalizeText(question);

  for (const item of faq.items) {
    const keywords = item.keywords?.[lang] || item.keywords?.en || [];
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalizedKeyword && normalizedQuestion.includes(normalizedKeyword)) {
        return item.answer[lang] || item.answer.en;
      }
    }
  }

  return faq.fallback[lang] || faq.fallback.en;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
    .trim();
}

function canAccessLesson(userId, lessonId) {
  return freeLessons.has(lessonId) || canAccessPaidLessons(userId);
}

function canAccessPaidLessons(userId) {
  const id = Number(userId);
  if (adminIds.has(id) || envUnlockedIds.has(id)) return true;
  const unlocked = readJson(UNLOCKED_FILE, []);
  return unlocked.includes(String(userId));
}

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [file, fallback] of [
    [USERS_FILE, {}],
    [PROGRESS_FILE, {}],
    [UNLOCKED_FILE, []]
  ]) {
    if (!fs.existsSync(file)) writeJson(file, fallback);
  }
}

async function sendMessage(chatId, textValue, extra = {}) {
  return telegram("sendMessage", { chat_id: chatId, text: textValue, ...extra });
}

async function answerCallbackQuery(callbackQueryId) {
  return telegram("answerCallbackQuery", { callback_query_id: callbackQueryId });
}

async function telegram(method, payload) {
  const response = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`${method} failed: ${data.description || response.statusText}`);
  }
  return data.result;
}

function readJson(filePath, fallback = null) {
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseIdList(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

