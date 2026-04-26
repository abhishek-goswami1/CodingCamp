import { connect } from "../../utils/db";
import User from "../../models/User";
import Course from "../../models/Course";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ msg: "Method not allowed" });

  await connect();

  try {
    const { userId, course: courseSlug, playedSeconds, duration } = req.body;

    if (!userId || !courseSlug || playedSeconds === undefined || !duration) {
      console.error("[progress] Missing fields:", {
        userId,
        courseSlug,
        playedSeconds,
        duration,
      });
      return res.status(400).json({ msg: "Missing required fields" });
    }

    console.log(
      `[progress] PUT userId=${userId} course=${courseSlug} played=${Math.floor(playedSeconds)} duration=${Math.floor(duration)}`,
    );

    const user = await User.findOne({ user: userId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const userCourse = user.courses.find((c) => c.course === courseSlug);
    if (!userCourse)
      return res.status(404).json({ msg: "Course not enrolled" });

    // Anti-hack: only allow increasing progress
    if (playedSeconds > (userCourse.videoProgress || 0)) {
      userCourse.videoProgress = playedSeconds;
    }

    // Check video completion (95% threshold)
    const percentage = playedSeconds / duration;
    if (percentage >= 0.95) {
      userCourse.videoCompleted = true;
    }

    // Check full course completion
    const courseDoc = await Course.findOne({ course: courseSlug });
    const needsQuiz = courseDoc && courseDoc.quiz && courseDoc.quiz.length > 0;

    if (!needsQuiz) {
      userCourse.quizPassed = true;
    }

    if (userCourse.videoCompleted && userCourse.quizPassed) {
      userCourse.completed = true;
    }

    console.log("[progress] Saving:", {
      videoCompleted: userCourse.videoCompleted,
      quizPassed: userCourse.quizPassed,
      completed: userCourse.completed,
      percentage: percentage.toFixed(2),
    });

    user.markModified("courses");
    await user.save();

    return res.status(200).json({
      success: true,
      progress: userCourse.videoProgress,
      videoCompleted: userCourse.videoCompleted,
      quizPassed: userCourse.quizPassed,
      completed: userCourse.completed,
    });
  } catch (err) {
    console.error("[progress] error:", err);
    return res.status(500).json({ msg: "Something went wrong" });
  }
}
