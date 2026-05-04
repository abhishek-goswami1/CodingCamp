/**
 * One-time migration script: seeds MongoDB Course collection
 * from the legacy course-list.json + hardcoded quiz/resource data.
 *
 * Usage:
 *   node scripts/seed-courses.js
 *
 * Requires MONGODB_URI to be set in your .env file.
 * Install dotenv first if running standalone: npm install dotenv
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in your .env file.");
  process.exit(1);
}

const CourseSchema = new mongoose.Schema({
  course: { type: String, required: true, unique: true, index: true },
  name: String,
  description: String,
  image: String,
  ytURL: String,
  resources: Array,
  quiz: Array,
  status: { type: String, default: "published" },
  createdAt: { type: Date, default: Date.now },
});

const Course =
  mongoose.models.Course || mongoose.model("Course", CourseSchema);

const courses = [
  {
    course: "web",
    name: "How Web Works",
    description:
      "The Web is the common name for the World Wide Web, a subset of the Internet consisting of the pages that can be accessed by a Web browser.",
    image: "web.svg",
    ytURL: "https://www.youtube.com/watch?v=hJHvdBlSxug",
    resources: [
      { name: "MDN — How the Web works", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works" },
      { name: "Web fundamentals", url: "https://developers.google.com/web/fundamentals" },
    ],
    quiz: [
      { question: "What does HTTP stand for?", options: [{ answer: "HyperText Transfer Protocol", isCorrect: true }, { answer: "HighText Transfer Protocol", isCorrect: false }, { answer: "HyperText Transmission Protocol", isCorrect: false }, { answer: "None of the above", isCorrect: false }] },
      { question: "Which protocol is used to secure web communication?", options: [{ answer: "FTP", isCorrect: false }, { answer: "SMTP", isCorrect: false }, { answer: "HTTPS", isCorrect: true }, { answer: "HTTP", isCorrect: false }] },
      { question: "What is a DNS?", options: [{ answer: "Domain Name System", isCorrect: true }, { answer: "Digital Network Service", isCorrect: false }, { answer: "Data Name Server", isCorrect: false }, { answer: "Dynamic Name System", isCorrect: false }] },
    ],
  },
  {
    course: "HTML",
    name: "HTML",
    description:
      "HTML is the foundation of all web pages. It defines the meaning and structure of web content.",
    image: "html.svg",
    ytURL: "https://www.youtube.com/watch?v=pQN-pnXPaVg",
    resources: [
      { name: "MDN HTML Reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
      { name: "W3Schools HTML Tutorial", url: "https://www.w3schools.com/html/" },
    ],
    quiz: [
      { question: "What does HTML stand for?", options: [{ answer: "HyperText Markup Language", isCorrect: true }, { answer: "High Text Markup Language", isCorrect: false }, { answer: "HyperText Marking Language", isCorrect: false }, { answer: "Hyperlink and Text Markup Language", isCorrect: false }] },
      { question: "Which tag is used for the largest heading?", options: [{ answer: "<h6>", isCorrect: false }, { answer: "<h1>", isCorrect: true }, { answer: "<head>", isCorrect: false }, { answer: "<heading>", isCorrect: false }] },
      { question: "Which attribute specifies a link destination?", options: [{ answer: "src", isCorrect: false }, { answer: "href", isCorrect: true }, { answer: "link", isCorrect: false }, { answer: "url", isCorrect: false }] },
    ],
  },
  {
    course: "css",
    name: "CSS",
    description:
      "CSS is a stylesheet language used to describe the presentation of a document written in HTML.",
    image: "css.svg",
    ytURL: "https://youtu.be/Z4pCqK-V_Wo?si=jYLK0MXZR_6GS5vJ",
    resources: [
      { name: "MDN CSS Reference", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
      { name: "CSS Tricks", url: "https://css-tricks.com/" },
    ],
    quiz: [
      { question: "What does CSS stand for?", options: [{ answer: "Cascading Style Sheets", isCorrect: true }, { answer: "Creative Style System", isCorrect: false }, { answer: "Computer Style Sheets", isCorrect: false }, { answer: "Colorful Style Sheets", isCorrect: false }] },
      { question: "Which property changes text colour?", options: [{ answer: "font-color", isCorrect: false }, { answer: "text-color", isCorrect: false }, { answer: "color", isCorrect: true }, { answer: "foreground-color", isCorrect: false }] },
      { question: "Which selector targets an element with id='main'?", options: [{ answer: ".main", isCorrect: false }, { answer: "#main", isCorrect: true }, { answer: "*main", isCorrect: false }, { answer: "main", isCorrect: false }] },
    ],
  },
  {
    course: "js",
    name: "JavaScript",
    description:
      "JavaScript is a lightweight, interpreted, object-oriented language with first-class functions.",
    image: "js.svg",
    ytURL: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
    resources: [
      { name: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
      { name: "javascript.info", url: "https://javascript.info/" },
    ],
    quiz: [
      { question: "Which keyword declares a block-scoped variable?", options: [{ answer: "var", isCorrect: false }, { answer: "let", isCorrect: true }, { answer: "define", isCorrect: false }, { answer: "variable", isCorrect: false }] },
      { question: "What does '===' check?", options: [{ answer: "Value only", isCorrect: false }, { answer: "Type only", isCorrect: false }, { answer: "Value and type", isCorrect: true }, { answer: "Neither", isCorrect: false }] },
      { question: "Which method adds an element to the end of an array?", options: [{ answer: "push()", isCorrect: true }, { answer: "pop()", isCorrect: false }, { answer: "shift()", isCorrect: false }, { answer: "append()", isCorrect: false }] },
    ],
  },
  {
    course: "react",
    name: "React",
    description:
      "React is a declarative, efficient, and flexible JavaScript library for building user interfaces.",
    image: "react.svg",
    ytURL: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
    resources: [
      { name: "React Official Docs", url: "https://react.dev/" },
      { name: "React Patterns", url: "https://reactpatterns.com/" },
    ],
    quiz: [
      { question: "What is JSX?", options: [{ answer: "A JavaScript XML syntax extension", isCorrect: true }, { answer: "A new language", isCorrect: false }, { answer: "A CSS framework", isCorrect: false }, { answer: "A build tool", isCorrect: false }] },
      { question: "Which hook manages local state?", options: [{ answer: "useEffect", isCorrect: false }, { answer: "useRef", isCorrect: false }, { answer: "useState", isCorrect: true }, { answer: "useContext", isCorrect: false }] },
      { question: "What is a React component?", options: [{ answer: "A reusable UI building block", isCorrect: true }, { answer: "A database record", isCorrect: false }, { answer: "A CSS class", isCorrect: false }, { answer: "A server route", isCorrect: false }] },
    ],
  },
  {
    course: "git",
    name: "Git & GitHub",
    description:
      "Git is a free and open source distributed version control system. GitHub is a code hosting platform for version control and collaboration.",
    image: "git.svg",
    ytURL: "https://www.youtube.com/watch?v=RGOj5yH7evk",
    resources: [
      { name: "Git Official Docs", url: "https://git-scm.com/doc" },
      { name: "GitHub Docs", url: "https://docs.github.com/" },
    ],
    quiz: [
      { question: "What command stages all changes?", options: [{ answer: "git commit", isCorrect: false }, { answer: "git add .", isCorrect: true }, { answer: "git push", isCorrect: false }, { answer: "git stage", isCorrect: false }] },
      { question: "Which command creates a new branch?", options: [{ answer: "git branch new-branch", isCorrect: true }, { answer: "git new branch", isCorrect: false }, { answer: "git make branch", isCorrect: false }, { answer: "git checkout branch", isCorrect: false }] },
      { question: "What does 'git clone' do?", options: [{ answer: "Copies a repository locally", isCorrect: true }, { answer: "Deletes a repository", isCorrect: false }, { answer: "Creates an empty repo", isCorrect: false }, { answer: "Merges two branches", isCorrect: false }] },
    ],
  },
  {
    course: "node",
    name: "Node",
    description:
      "Node.js is a free, open-sourced, cross-platform JavaScript run-time environment.",
    image: "node.svg",
    ytURL: "https://www.youtube.com/watch?v=fBNz5xF-Kx4",
    resources: [
      { name: "Node.js Official Docs", url: "https://nodejs.org/en/docs/" },
      { name: "Node.js Best Practices", url: "https://github.com/goldbergyoni/nodebestpractices" },
    ],
    quiz: [
      { question: "What is Node.js?", options: [{ answer: "A browser API", isCorrect: false }, { answer: "A JavaScript runtime built on V8", isCorrect: true }, { answer: "A CSS preprocessor", isCorrect: false }, { answer: "A database", isCorrect: false }] },
      { question: "Which module handles HTTP in Node.js?", options: [{ answer: "fs", isCorrect: false }, { answer: "http", isCorrect: true }, { answer: "path", isCorrect: false }, { answer: "os", isCorrect: false }] },
      { question: "What is npm?", options: [{ answer: "Node Package Manager", isCorrect: true }, { answer: "New Project Manager", isCorrect: false }, { answer: "Node Project Module", isCorrect: false }, { answer: "None of the above", isCorrect: false }] },
    ],
  },
  {
    course: "mongodb",
    name: "MongoDB",
    description:
      "MongoDB is a document-oriented NoSQL database used for high volume data storage.",
    image: "mongodb.svg",
    ytURL: "https://www.youtube.com/watch?v=-56x56UppqQ",
    resources: [
      { name: "MongoDB Official Docs", url: "https://www.mongodb.com/docs/" },
      { name: "Mongoose Docs", url: "https://mongoosejs.com/docs/" },
    ],
    quiz: [
      { question: "What type of database is MongoDB?", options: [{ answer: "Relational", isCorrect: false }, { answer: "Document-oriented NoSQL", isCorrect: true }, { answer: "Graph", isCorrect: false }, { answer: "Key-value only", isCorrect: false }] },
      { question: "What is a MongoDB collection?", options: [{ answer: "A table equivalent", isCorrect: true }, { answer: "A row of data", isCorrect: false }, { answer: "A schema definition", isCorrect: false }, { answer: "An index", isCorrect: false }] },
      { question: "Which query operator checks for equality?", options: [{ answer: "$gt", isCorrect: false }, { answer: "$eq", isCorrect: true }, { answer: "$ne", isCorrect: false }, { answer: "$in", isCorrect: false }] },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅  Connected to MongoDB");

    for (const courseData of courses) {
      await Course.findOneAndUpdate(
        { course: courseData.course },
        courseData,
        { upsert: true, new: true }
      );
      console.log(`   • Seeded: ${courseData.name}`);
    }

    console.log("✅  All courses seeded successfully.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("   Disconnected.");
  }
}

seed();
