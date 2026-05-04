const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PDFDocument = require('pdfkit'); // Simple PDF generator

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/learning-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'));

// =======================
// 1. DATABASE SCHEMAS
// =======================

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String
}));

const Course = mongoose.model('Course', new mongoose.Schema({
  title: String,
  description: String
}));

const Video = mongoose.model('Video', new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  title: String,
  youtubeId: String, 
  duration: Number,
  order: Number
}));

const UserProgress = mongoose.model('UserProgress', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  watchTime: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastUpdatedAt: { type: Date, default: Date.now }
}));

// =======================
// 2. BACKEND APIs
// =======================

// Get Course Progress
app.get('/course-progress', async (req, res) => {
  const { userId, courseId } = req.query;
  const progress = await UserProgress.find({ userId, courseId });
  const videos = await Video.find({ courseId });
  
  const completedVideos = progress.filter(p => p.completed).length;
  // Mark course as completed only if all videos are completed
  const courseCompleted = videos.length > 0 && completedVideos === videos.length;

  res.json({ progress, courseCompleted, totalVideos: videos.length, completedVideos });
});

// Track Video Progress
app.post('/track-progress', async (req, res) => {
  const { userId, courseId, videoId, watchTime, duration } = req.body;
  
  let progress = await UserProgress.findOne({ userId, videoId });
  if (!progress) {
    progress = new UserProgress({ userId, courseId, videoId });
  }

  // Prevent decreasing watch time
  if (watchTime > progress.watchTime) {
    progress.watchTime = watchTime;
  }

  // Logic: Mark video as completed if user watches at least 90%
  if (watchTime >= duration * 0.9) {
    progress.completed = true;
  }

  progress.lastUpdatedAt = Date.now();
  await progress.save();

  res.json({ success: true, progress });
});

// Mark Complete (Manual or forced)
app.post('/mark-complete', async (req, res) => {
  const { userId, videoId } = req.body;
  
  await UserProgress.updateOne(
    { userId, videoId }, 
    { completed: true, lastUpdatedAt: Date.now() }
  );

  res.json({ success: true });
});

// Generate Certificate
app.get('/generate-certificate', async (req, res) => {
  const { userId, courseId } = req.query;
  
  const user = await User.findById(userId);
  const course = await Course.findById(courseId);
  const videos = await Video.find({ courseId });
  const progress = await UserProgress.find({ userId, courseId, completed: true });

  if (!user || !course) return res.status(404).json({ error: "Not found" });

  if (progress.length < videos.length) {
    return res.status(400).json({ error: "Course not fully completed" });
  }

  // Generate PDF
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${courseId}.pdf`);
  doc.pipe(res);

  doc.rect(20, 20, 800, 550).stroke();
  doc.fontSize(40).text('Certificate of Completion', { align: 'center', marginTop: 100 });
  doc.moveDown();
  doc.fontSize(20).text('This is to certify that', { align: 'center' });
  doc.moveDown();
  doc.fontSize(30).text(user.name, { align: 'center', underline: true });
  doc.moveDown();
  doc.fontSize(20).text(`has successfully completed the course:`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(25).text(course.title, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(15).text(`Awarded on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  
  doc.end();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
