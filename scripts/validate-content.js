const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "content", "lessons.json");
const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
const content = JSON.parse(raw);
const faqRaw = fs.readFileSync(path.join(__dirname, "..", "content", "faq.json"), "utf8").replace(/^\uFEFF/, "");
const faq = JSON.parse(faqRaw);

if (!Array.isArray(content.lessons)) {
  throw new Error("content.lessons must be an array");
}

if (content.lessons.length !== 20) {
  throw new Error(`Expected 20 lessons, found ${content.lessons.length}`);
}

for (const lesson of content.lessons) {
  for (const lang of content.product.supportedLanguages) {
    if (!lesson.title?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing title.${lang}`);
    }
    if (!lesson.summary?.[lang]) {
      throw new Error(`Lesson ${lesson.id} is missing summary.${lang}`);
    }
  }
}

if (!Array.isArray(faq.items) || faq.items.length === 0) {
  throw new Error("content/faq.json must contain FAQ items");
}

console.log("content/lessons.json OK");
