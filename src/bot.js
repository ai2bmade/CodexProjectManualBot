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
const STATE_FILE = path.join(DATA_DIR, "lesson_state.json");
const CONTENT_FILE = path.join(__dirname, "..", "content", "lessons.json");

const content = readJson(CONTENT_FILE);
const supportedLanguages = content.product.supportedLanguages;
const comingSoonLanguages = content.product.comingSoonLanguages;
const freeLessons = new Set(content.product.freeLessons);
const lessonsById = new Map(content.lessons.map((lesson) => [lesson.id, lesson]));
const adminIds = parseIdList(process.env.ADMIN_USER_IDS);
const envUnlockedIds = parseIdList(process.env.UNLOCKED_USER_IDS);

ensureDataFiles();

const ui = {
  en: {
    languageName: "English",
    chooseLanguage: "Welcome to Codex Project Manual Bot.\n\nChoose your lesson language:",
    saved: "Language saved: English",
    comingSoon: "This language is coming soon. For now, please choose English, Korean, or Latin American Spanish.",
    intro:
      "This bot teaches Codex projects like a manual, in lesson order. As you move through the lessons, you will feel your skills improving. To keep this course inexpensive, generative AI question answering is kept to a minimum.\n\nUse /lesson0 or /lessons to begin.",
    lessonsHeader: "Course Roadmap",
    free: "free",
    locked: "locked",
    unlocked: "unlocked",
    openLesson: "Open a lesson with /lesson0.",
    noLesson: "I could not find that lesson. Use /lessons.",
    lockedLesson: "This lesson is locked. Lessons 0, 1, and 2 are free. Use /unlock for the full 20-lesson course.",
    nextUsage: "Open a lesson first with /lesson0. Then use /next.",
    repeatUsage: "Open a lesson first with /lesson0. Then use /repeat.",
    finalStep: "You reached the last step of this lesson.",
    help:
      "Commands:\n/start - choose language\n/lessons - course roadmap\n/lesson0 - open lesson 0\n/next - next step\n/repeat - repeat current step\n/done 0 - mark a lesson complete (replace 0 with the lesson number)\n/status - progress\n/unlock - unlock info\n/help - help\n\nQuestions are welcome. The bot does not pretend to be a live AI tutor. Instead, it gives you a prompt to paste into ChatGPT or Codex.",
    askTemplate:
      "Question accepted.\n\nPaste this into ChatGPT or Codex:\n\nI am following a beginner course about ChatGPT and Codex. Please answer like a patient tutor. I am currently on lesson {{lesson}}. My question is: {{question}}\n\nPlease do three things:\n1. Explain simply.\n2. Point out the most likely mistake.\n3. Give me one clear next step.",
    askNoState:
      "Question accepted.\n\nPaste this into ChatGPT or Codex:\n\nI am following a beginner course about ChatGPT and Codex. Please answer like a patient tutor. My question is: {{question}}\n\nPlease explain simply and give me one clear next step.",
    status: "Status",
    language: "Language",
    completed: "Completed lessons",
    available: "Available lessons",
    markedDone: "Lesson marked complete.",
    doneUsage: "Use /done 0 after finishing a lesson. Replace 0 with the lesson number.",
    doneReminder: "Use /done {{lessonId}} when you finish it.",
    unlock:
      "Lessons 0, 1, and 2 are free.\n\nThe full 20-lesson practice course can be unlocked for $3. The bot stays inexpensive by teaching through structured steps instead of calling AI for every student message.",
    unlockNoUrl: "Payment link is not configured yet. Set BUY_ME_A_COFFEE_URL in Coolify.",
    adminOnly: "Admin only.",
    unlockUserUsage: "Use /unlock_user TELEGRAM_USER_ID",
    userUnlocked: "User unlocked.",
    partLabel: "Part",
    chapterLabel: "Chapter",
    lessonLabel: "Lesson",
    stepHeader: "Current step",
    lessonOutline: "Lesson flow",
    bigPicture: "Purpose and background",
    thisLesson: "What you will do in this lesson",
    taskLabel: "Check after this lesson",
    stepPrompt: "Copy this into ChatGPT or Codex",
    mediaLabel: "Optional media idea",
    buttonNext: "Done, next step",
    buttonRepeat: "Repeat step",
    buttonLessonZero: "Lesson 0",
    buttonLessons: "Lessons"
  },
  ko: {
    languageName: "???",
    chooseLanguage: "Codex Project Manual Bot? ?? ?? ?????.\n\n?? ??? ??? ???:",
    saved: "??? ???????: ???",
    comingSoon: "? ??? ? ??? ?????. ??? English, ???, Espa?ol latinoamericano ??? ??? ???.",
    intro:
      "? ?? ???? ????? ?? ??? ????? ???? ???? ????. ? ??? ???? ??? ???? ?? ??? ? ?? ????. ? ??? ???? ???? ?? ??? AI ????? ?????? ??? ?? ????.\n\n????? /lesson0 ?? /lessons ? ?????.",
    lessonsHeader: "?? ???",
    free: "??",
    locked: "??",
    unlocked: "??",
    openLesson: "/lesson0 ?? ??? ???.",
    noLesson: "?? ??? ?? ? ????. /lessons ? ??? ???.",
    lockedLesson: "? ??? ?? ????. ?? 0, 1, 2? ?????. ?? 20? ??? /unlock ?? ??? ???.",
    nextUsage: "?? /lesson0 ?? ??? ???. ??? /next ? ??? ???.",
    repeatUsage: "?? /lesson0 ?? ??? ???. ??? /repeat ? ??? ???.",
    finalStep: "? ??? ??? ???? ????.",
    help:
      "???:\n/start - ?? ??\n/lessons - ?? ???\n/lesson0 - ?? 0 ??\n/next - ?? ??\n/repeat - ?? ?? ?? ??\n/done 0 - ?? ?? ?? (0 ??? ?? ?? ??)\n/status - ?? ??\n/unlock - ?? ?? ??\n/help - ???\n\n??? ??? ? ? ????. ?? ? ?? ??? AI ???? ?? ??? ??, ChatGPT? Codex? ?? ?? ????? ?????.",
    askTemplate:
      "???. ?? ??? ??? ChatGPT ?? Codex? ?? ?? ???.\n\n?? ChatGPT? Codex? ??? ??????. ??? ???? ?? ???. ?? ?? {{lesson}} ??? ?? ????. ? ??? ?????: {{question}}\n\n?? ? ?? ???? ?? ???.\n1. ?? ?? ??? ???.\n2. ?? ?? ???? ?? ??? ?? ???.\n3. ?? ?? ? ?? ? ??? ?? ???.",
    askNoState:
      "???. ?? ??? ??? ChatGPT ?? Codex? ?? ?? ???.\n\n?? ChatGPT? Codex? ??? ??????. ??? ???? ?? ???. ? ??? ?????: {{question}}\n\n?? ?? ????, ?? ?? ? ?? ? ??? ?? ???.",
    status: "??",
    language: "??",
    completed: "??? ??",
    available: "?? ??? ??",
    markedDone: "?? ??? ???????.",
    doneUsage: "??? ?? ? /done 0 ???? ??? ???. 0 ??? ?? ??? ??? ???.",
    doneReminder: "??? ??? /done {{lessonId}} ? ??? ???.",
    unlock:
      "?? 0, 1, 2? ?????.\n\n?? 20? ?? ??? $3? ? ? ????. ? ?? ??? ?? ????? AI? ???? ??, ???? ??? ???? ???? ??? ??? ????.",
    unlockNoUrl: "?? ?? ??? ???? ?????. Coolify?? BUY_ME_A_COFFEE_URL ? ??? ???.",
    adminOnly: "???? ??? ? ????.",
    unlockUserUsage: "/unlock_user TELEGRAM_USER_ID ???? ??? ???.",
    userUnlocked: "???? ?? ?????.",
    partLabel: "??",
    chapterLabel: "??",
    lessonLabel: "??",
    stepHeader: "?? ??",
    lessonOutline: "?? ??? ??",
    bigPicture: "? ??? ??? ??",
    thisLesson: "?? ???? ? ?",
    taskLabel: "? ??? ??? ??? ??",
    stepPrompt: "ChatGPT ?? Codex? ?? ??",
    mediaLabel: "?? ?? ??? ????",
    buttonNext: "??/?? ??",
    buttonRepeat: "?? ?? ?? ??",
    buttonLessonZero: "?? 0",
    buttonLessons: "?? ??"
  },
  es_419: {
    languageName: "Espa?ol latinoamericano",
    chooseLanguage: "Bienvenido a Codex Project Manual Bot.\n\nElige el idioma del curso:",
    saved: "Idioma guardado: Espa?ol latinoamericano",
    comingSoon: "Este idioma llegar? pronto. Por ahora, elige English, ??? o Espa?ol latinoamericano.",
    intro:
      "Este bot ense?a proyectos con Codex como si fuera un manual, en orden de lecciones. A medida que avances, sentir?s que tu nivel mejora. Para mantener este curso econ?mico, las respuestas de IA generativa se reducen al m?nimo.\n\nUsa /lesson0 o /lessons para empezar.",
    lessonsHeader: "Mapa del curso",
    free: "gratis",
    locked: "bloqueada",
    unlocked: "desbloqueada",
    openLesson: "Abre una lecci?n con /lesson0.",
    noLesson: "No encontr? esa lecci?n. Usa /lessons.",
    lockedLesson: "Esta lecci?n est? bloqueada. Las lecciones 0, 1 y 2 son gratis. Usa /unlock para el curso completo de 20 lecciones.",
    nextUsage: "Primero abre una lecci?n con /lesson0. Luego usa /next.",
    repeatUsage: "Primero abre una lecci?n con /lesson0. Luego usa /repeat.",
    finalStep: "Llegaste al ?ltimo paso de esta lecci?n.",
    help:
      "Comandos:\n/start - elegir idioma\n/lessons - mapa del curso\n/lesson0 - abrir lecci?n 0\n/next - siguiente paso\n/repeat - repetir paso actual\n/done 0 - marcar una lecci?n como completa (reemplaza 0 por el n?mero de lecci?n)\n/status - progreso\n/unlock - informaci?n para desbloquear\n/help - ayuda\n\nLas preguntas son bienvenidas. El bot no finge ser un tutor AI en vivo. En cambio, te da un prompt para pegar en ChatGPT o Codex.",
    askTemplate:
      "Pregunta recibida.\n\nPega esto en ChatGPT o Codex:\n\nEstoy siguiendo un curso para principiantes sobre ChatGPT y Codex. Resp?ndeme como un tutor paciente. Estoy en la lecci?n {{lesson}}. Mi pregunta es: {{question}}\n\nPor favor haz tres cosas:\n1. Expl?calo de forma simple.\n2. Se?ala el error m?s probable.\n3. Dame un solo siguiente paso claro.",
    askNoState:
      "Pregunta recibida.\n\nPega esto en ChatGPT o Codex:\n\nEstoy siguiendo un curso para principiantes sobre ChatGPT y Codex. Resp?ndeme como un tutor paciente. Mi pregunta es: {{question}}\n\nExpl?calo de forma simple y luego dame un solo siguiente paso claro.",
    status: "Estado",
    language: "Idioma",
    completed: "Lecciones completadas",
    available: "Lecciones disponibles",
    markedDone: "Lecci?n marcada como completada.",
    doneUsage: "Usa /done 0 despu?s de terminar la lecci?n. Reemplaza 0 por el n?mero de lecci?n.",
    doneReminder: "Usa /done {{lessonId}} cuando la termines.",
    unlock:
      "Las lecciones 0, 1 y 2 son gratis.\n\nEl curso completo de 20 pr?cticas se puede desbloquear por $3. El bot se mantiene barato porque ense?a con pasos estructurados en lugar de llamar AI por cada mensaje del estudiante.",
    unlockNoUrl: "El enlace de pago no est? configurado. Configura BUY_ME_A_COFFEE_URL en Coolify.",
    adminOnly: "Solo admin.",
    unlockUserUsage: "Usa /unlock_user TELEGRAM_USER_ID",
    userUnlocked: "Usuario desbloqueado.",
    partLabel: "Parte",
    chapterLabel: "Cap?tulo",
    lessonLabel: "Lecci?n",
    stepHeader: "Paso actual",
    lessonOutline: "Orden de esta lecci?n",
    bigPicture: "Prop?sito y contexto",
    thisLesson: "Qu? har?s en esta lecci?n",
    taskLabel: "Al terminar esta lecci?n",
    stepPrompt: "Pega esto en ChatGPT o Codex",
    mediaLabel: "Idea opcional de media",
    buttonNext: "Hecho, siguiente paso",
    buttonRepeat: "Repetir paso",
    buttonLessonZero: "Lecci?n 0",
    buttonLessons: "Lecciones"
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
  if (update.callback_query) return handleCallback(update.callback_query);
  if (update.message?.text) return handleMessage(update.message);
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
  if (value === "/next") return sendNextStep(chatId, userId);
  if (value === "/repeat") return repeatCurrentStep(chatId, userId);

  let match = value.match(/^\/lesson(?:\s+(\d+))?$/);
  if (match) return openLesson(chatId, userId, Number(match[1]));

  match = value.match(/^\/lesson(\d+)$/);
  if (match) return openLesson(chatId, userId, Number(match[1]));

  match = value.match(/^\/done(?:\s+(\d+))?$/);
  if (match) return markDone(chatId, userId, Number(match[1]));

  match = value.match(/^\/unlock_user(?:\s+(\d+))?$/);
  if (match) return unlockUser(chatId, userId, match[1]);

  return sendQuestionPrompt(chatId, userId, value);
}

async function handleCallback(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data || "";

  if (data === "step:next") {
    await answerCallbackQuery(query.id);
    return sendNextStep(chatId, userId);
  }

  if (data === "step:repeat") {
    await answerCallbackQuery(query.id);
    return repeatCurrentStep(chatId, userId);
  }

  if (data === "nav:lessons") {
    await answerCallbackQuery(query.id);
    return sendMessage(chatId, buildLessonsMessage(userId), homeReplyMarkup(userId));
  }

  let match = data.match(/^nav:lesson:(\d+)$/);
  if (match) {
    await answerCallbackQuery(query.id);
    return openLesson(chatId, userId, Number(match[1]));
  }

  if (!data.startsWith("lang:")) return answerCallbackQuery(query.id);

  const lang = data.slice("lang:".length);
  if (comingSoonLanguages.includes(lang)) {
    await answerCallbackQuery(query.id);
    return sendMessage(chatId, ui.en.comingSoon);
  }

  if (!supportedLanguages.includes(lang)) return answerCallbackQuery(query.id);

  setUserLanguage(userId, lang);
  await answerCallbackQuery(query.id);
  return sendMessage(chatId, `${ui[lang].saved}\n\n${ui[lang].intro}`, homeReplyMarkup(userId));
}

async function sendLanguageMenu(chatId) {
  return sendMessage(chatId, ui.en.chooseLanguage, {
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

function homeReplyMarkup(userId) {
  const copy = t(userId);
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: copy.buttonLessonZero || "Lesson 0", callback_data: "nav:lesson:0" },
          { text: copy.buttonLessons || "Lessons", callback_data: "nav:lessons" }
        ]
      ]
    }
  };
}

async function openLesson(chatId, userId, lessonId) {
  const copy = t(userId);
  const lang = getUserLanguage(userId);
  if (lessonId === undefined || Number.isNaN(lessonId)) return sendMessage(chatId, copy.openLesson);

  const lesson = lessonsById.get(lessonId);
  if (!lesson) return sendMessage(chatId, copy.noLesson);
  if (!canAccessLesson(userId, lessonId)) return sendMessage(chatId, copy.lockedLesson);

  setLessonState(userId, { lessonId, stepIndex: 0 });

  const overview = [
    `${copy.partLabel} ${lesson.part} / ${copy.chapterLabel} ${lesson.chapter}`,
    `${copy.lessonLabel} ${lesson.id}. ${lesson.title[lang]}`,
    "",
    `${copy.bigPicture}`,
    `${lesson.bigPicture[lang]}`,
    "",
    `${copy.thisLesson}`,
    `${lesson.summary[lang]}`,
    "",
    `${copy.lessonOutline}`,
    ...lesson.outline[lang].map((item, index) => `${index + 1}. ${item}`),
    "",
    `${copy.taskLabel}`,
    `${lesson.assignment[lang]}`
  ].join("\n");

  await sendLongMessage(chatId, overview);
  return sendCurrentStep(chatId, userId);
}

async function sendCurrentStep(chatId, userId) {
  const copy = t(userId);
  const lang = getUserLanguage(userId);
  const state = getLessonState(userId);
  if (!state) return sendMessage(chatId, copy.openLesson);

  const lesson = lessonsById.get(state.lessonId);
  if (!lesson) return sendMessage(chatId, copy.noLesson);

  const step = lesson.steps[state.stepIndex];
  if (!step) return sendMessage(chatId, copy.noLesson);

  const lines = [
    `${copy.stepHeader}: ${state.stepIndex + 1} / ${lesson.steps.length}`,
    `${step.title[lang]}`,
    "",
    `${step.body[lang]}`
  ];

  if (step.prompt?.[lang]) {
    lines.push("", `${copy.stepPrompt}`, "", `${step.prompt[lang]}`);
  }

  if (step.media?.[lang]) {
    lines.push("", `${copy.mediaLabel}`, `${step.media[lang]}`);
  }

  return sendLongMessage(chatId, lines.join("\n"), stepReplyMarkup(userId));
}

async function sendNextStep(chatId, userId) {
  const copy = t(userId);
  const lang = getUserLanguage(userId);
  const state = getLessonState(userId);
  if (!state) return sendMessage(chatId, copy.nextUsage);

  const lesson = lessonsById.get(state.lessonId);
  if (!lesson) return sendMessage(chatId, copy.noLesson);

  if (state.stepIndex >= lesson.steps.length - 1) {
    const finalText = [
      copy.finalStep,
      "",
      `${copy.taskLabel}`,
      `${lesson.assignment[lang]}`,
      "",
      copy.doneReminder.replace("{{lessonId}}", String(lesson.id))
    ].join("\n");
    return sendMessage(chatId, finalText, stepReplyMarkup(userId));
  }

  setLessonState(userId, {
    lessonId: state.lessonId,
    stepIndex: state.stepIndex + 1
  });
  return sendCurrentStep(chatId, userId);
}

async function repeatCurrentStep(chatId, userId) {
  const copy = t(userId);
  if (!getLessonState(userId)) return sendMessage(chatId, copy.repeatUsage);
  return sendCurrentStep(chatId, userId);
}

async function markDone(chatId, userId, lessonId) {
  const copy = t(userId);
  if (lessonId === undefined || Number.isNaN(lessonId) || !lessonsById.has(lessonId)) return sendMessage(chatId, copy.doneUsage);
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
  const available = canAccessPaidLessons(userId) ? "0-20" : "0-2";
  return sendMessage(
    chatId,
    `${copy.status}\n${copy.language}: ${content.languages[lang]}\n${copy.completed}: ${completed.length}/20\n${copy.available}: ${available}`
  );
}

async function sendUnlock(chatId, userId) {
  const copy = t(userId);
  const url = process.env.BUY_ME_A_COFFEE_URL;
  return sendMessage(chatId, `${copy.unlock}\n\n${url || copy.unlockNoUrl}`);
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

async function sendQuestionPrompt(chatId, userId, question) {
  const copy = t(userId);
  const cleanQuestion = question.replace(/^\/+/, "").trim() || "...";
  const state = getLessonState(userId);

  if (!state) {
    return sendLongMessage(
      chatId,
      copy.askNoState.replace("{{question}}", cleanQuestion)
    );
  }

  const lesson = lessonsById.get(state.lessonId);
  const lang = getUserLanguage(userId);
  const lessonLabel = `${lesson.id}. ${lesson.title[lang]}`;
  const prompt = copy.askTemplate
    .replace("{{lesson}}", lessonLabel)
    .replace("{{question}}", cleanQuestion);
  return sendLongMessage(chatId, prompt);
}

function buildLessonsMessage(userId) {
  const lang = getUserLanguage(userId);
  const copy = t(userId);
  const lines = [`${copy.lessonsHeader}`, ""];

  for (const part of content.curriculum[lang]) {
    lines.push(`${copy.partLabel} ${part.part}. ${part.title}`);
    for (const lessonId of part.lessonIds) {
      const lesson = lessonsById.get(lessonId);
      const status = canAccessLesson(userId, lessonId)
        ? freeLessons.has(lessonId)
          ? copy.free
          : copy.unlocked
        : copy.locked;
      lines.push(`${copy.lessonLabel} ${lesson.id}. ${lesson.title[lang]} - ${status}`);
    }
    lines.push("");
  }

  lines.push(copy.openLesson);
  lines.push("Quick open: /lesson0");
  return lines.join("\n");
}

function t(userId) {
  return ui[getUserLanguage(userId)] || ui.en;
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

function getLessonState(userId) {
  const state = readJson(STATE_FILE, {});
  return state[String(userId)] || null;
}

function setLessonState(userId, value) {
  const state = readJson(STATE_FILE, {});
  state[String(userId)] = value;
  writeJson(STATE_FILE, state);
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

async function sendLongMessage(chatId, message, extra = {}) {
  const chunks = splitMessage(message, 3800);
  for (const [index, chunk] of chunks.entries()) {
    await sendMessage(chatId, chunk, index === chunks.length - 1 ? extra : {});
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

function stepReplyMarkup(userId) {
  const copy = t(userId);
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: copy.buttonNext, callback_data: "step:next" },
          { text: copy.buttonRepeat, callback_data: "step:repeat" }
        ]
      ]
    }
  };
}

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [file, fallback] of [
    [USERS_FILE, {}],
    [PROGRESS_FILE, {}],
    [UNLOCKED_FILE, []],
    [STATE_FILE, {}]
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
  if (!data.ok) throw new Error(`${method} failed: ${data.description || response.statusText}`);
  return data.result;
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
