const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "content", "lessons.json");
const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
const content = JSON.parse(raw);

if (!Array.isArray(content.lessons)) {
  throw new Error("content.lessons must be an array");
}

if (content.lessons.length < 2) {
  throw new Error(`Expected at least 2 lessons, found ${content.lessons.length}`);
}

if (!content.curriculum) {
  throw new Error("content.curriculum is required");
}

for (const lesson of content.lessons) {
  if (!Number.isInteger(lesson.part) || !Number.isInteger(lesson.chapter)) {
    throw new Error(`Lesson ${lesson.id} must contain integer part and chapter`);
  }
  for (const lang of content.product.supportedLanguages) {
    if (!lesson.title?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing title.${lang}`);
    }
    if (!lesson.summary?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing summary.${lang}`);
    }
    if (!lesson.bigPicture?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing bigPicture.${lang}`);
    }
    if (!Array.isArray(lesson.outline?.[lang]) || lesson.outline[lang].length === 0) {
      throw new Error(`Lesson ${lesson.id} is missing outline.${lang}`);
    }
    if (!lesson.assignment?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing assignment.${lang}`);
    }
  }
  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
    throw new Error(`Lesson ${lesson.id} must contain steps`);
  }
}

console.log("content/lessons.json OK");
