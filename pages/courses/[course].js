import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/router";

import { useUser } from "@clerk/nextjs";
import ReactPlayer from "react-player/youtube";
import toast, { Toaster } from "react-hot-toast";
import { ExternalLink, Award } from "react-feather";
import jsPDF from "jspdf";

import Quiz from "../../components/Quiz";

const toastStyles = {
  fontSize: "1.2rem",
  fontWeight: "600",
  backgroundColor: "#212529",
  color: "#fff",
};

function CoursePage({ course }) {
  const router = useRouter();
  const { user } = useUser();

  const [checkCourseCompleted, setCheckCourseCompleted] = useState(false);
  const [maxPlayedSeconds, setMaxPlayedSeconds] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [resumePosition, setResumePosition] = useState(null);
  const lastSavedSecRef = useRef(0); // track last save to avoid duplicate API hits
  const videoCompletedToastRef = useRef(false);

  const playerRef = useRef(null);
  const quizRef = useRef(null);
  const userIdRef = useRef(null);

  // Keep userIdRef synced with latest user.id
  useEffect(() => {
    if (user?.id) {
      userIdRef.current = user.id;
    }
  }, [user?.id]);

  // Initialize progress
  useEffect(() => {
    const initUserProgress = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user/${user.id}`, { cache: "no-store" });
        const data = await res.json();

        if (!data.length) {
          await fetch(`/api/user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: user.id,
              courses: [
                {
                  course: router.query.course,
                  completed: false,
                  videoProgress: 0,
                },
              ],
            }),
          });
          return;
        }

        const courseObj = data[0].courses.find(
          (c) => c.course === router.query.course,
        );

        if (courseObj) {
          setCheckCourseCompleted(courseObj.completed);
          setMaxPlayedSeconds(courseObj.videoProgress || 0);
          // Auto-seek to where they left off
          if (courseObj.videoProgress > 0 && !courseObj.videoCompleted) {
            setResumePosition(courseObj.videoProgress);
          }
        } else {
          await fetch(`/api/user/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course: router.query.course,
              completed: false,
            }),
          });
        }
      } catch (err) {
        console.error("Failed to fetch progress", err);
      }
    };
    initUserProgress();
  }, [user?.id, router.query.course]);

  const saveProgressToDB = async (playedSeconds, duration) => {
    if (!router.query.course) return; // guard: no course slug yet
    const currentUserId = userIdRef.current || user?.id;
    if (!currentUserId) {
      toast.error("User ID not loaded yet. Try again.", { style: toastStyles });
      return;
    }

    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          course: router.query.course,
          playedSeconds,
          duration,
        }),
      });
      const data = await res.json();
      console.log(
        `[progress] status=${res.status} course=${router.query.course} played=${Math.floor(playedSeconds)}s`,
        data,
      );

      if (!res.ok) {
        toast.error(`Progress save failed: ${data.msg || res.status}`, {
          style: toastStyles,
        });
        console.error("[progress] API error:", res.status, data);
        return;
      }

      if (data.completed) {
        setCheckCourseCompleted(true);
        toast.success("Course completely finished! 🎉", { style: toastStyles });
      } else if (data.videoCompleted && !videoCompletedToastRef.current) {
        videoCompletedToastRef.current = true;
        if (course.quiz && course.quiz.length > 0) {
          toast.success("Video done! Scroll down to pass the quiz.", { style: toastStyles });
          quizRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (err) {
      console.error("Progress save failed", err);
      toast.error("Network error while saving progress", {
        style: toastStyles,
      });
    }
  };

  const handleReady = () => {
    setIsReady(true);
  };

  const handleDuration = (d) => {
    setDuration(d);
    // Seek only after duration is available to prevent getDuration errors
    if (resumePosition && playerRef.current) {
      playerRef.current.seekTo(resumePosition, "seconds");
      setResumePosition(null);
    }
  };

  // Anti-skip logic
  const handleProgress = (state) => {
    if (isSeeking || !isReady || !duration) return;

    const newMax = Math.max(maxPlayedSeconds, state.playedSeconds);
    setMaxPlayedSeconds(newMax);

    // Flawless completion detection: checks every second, completely bypassing YouTube's buggy onEnded event
    const percentage = state.playedSeconds / duration;
    if (percentage >= 0.95 && lastSavedSecRef.current !== 'completed') {
      lastSavedSecRef.current = 'completed';
      saveProgressToDB(duration, duration);
      return;
    }

    const flooredSec = Math.floor(state.playedSeconds);
    if (
      flooredSec > 0 &&
      flooredSec % 10 === 0 &&
      flooredSec !== lastSavedSecRef.current &&
      lastSavedSecRef.current !== "completed"
    ) {
      lastSavedSecRef.current = flooredSec;
      saveProgressToDB(state.playedSeconds, duration);
    }
  };

  const handleSeek = (seconds) => {
    setIsSeeking(true);
    // If they scrubbed past 95%, manually trigger completion
    if (duration > 0 && seconds / duration >= 0.95) {
      saveProgressToDB(duration, duration);
    }
    // Auto-reset after seeking completes to avoid blocking handleProgress
    setTimeout(() => setIsSeeking(false), 1500);
  };

  // Save progress when user pauses
  const handlePause = () => {
    if (isReady && duration > 0 && maxPlayedSeconds > 0) {
      saveProgressToDB(maxPlayedSeconds, duration);
    }
  };

  const handleEnded = () => {
    if (duration > 0) {
      saveProgressToDB(duration, duration); // Save 100%
    }
  };

  // Force re-evaluation of completion when quiz is passed
  const handleQuizPassed = async () => {
    if (duration > 0) {
      await saveProgressToDB(maxPlayedSeconds, duration);
    }
  };

  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [800, 600],
    });

    const userName = user?.fullName || user?.firstName || "Student";
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const drawContent = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(40);
      doc.text("Certificate of Completion", 400, 150, null, null, "center");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(20);
      doc.text("This certifies that", 400, 250, null, null, "center");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(35);
      doc.text(userName, 400, 300, null, null, "center");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(20);
      doc.text(
        `has successfully completed the course:`,
        400,
        370,
        null,
        null,
        "center",
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text(course.name, 400, 420, null, null, "center");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text(`Awarded on ${date}`, 400, 500, null, null, "center");

      doc.save(`${course.course}-certificate.pdf`);
    };

    const img = new Image();
    img.onload = () => {
      doc.addImage(img, "PNG", 0, 0, 800, 600);
      drawContent();
    };
    img.onerror = () => {
      // Fallback to basic border if image fails
      doc.setLineWidth(4);
      doc.rect(20, 20, 760, 560);
      drawContent();
    };
    img.src = "/certificate.png";
  };

  return (
    <>
      <Script src="/scripts/smoothscroll.min.js" strategy="beforeInteractive" />
      <div className="course">
        <div className="course__player">
          <ReactPlayer
            ref={playerRef}
            url={course.ytURL}
            className="react-player"
            controls={true}
            onReady={handleReady}
            onDuration={handleDuration}
            onProgress={handleProgress}
            onSeek={handleSeek}
            onPlay={() => setIsSeeking(false)}
            onPause={handlePause}
            onEnded={handleEnded}
            progressInterval={1000}
          />
        </div>

        {course.resources && course.resources.length > 0 && (
          <div className="course__resources">
            <h1 className="course__resources-heading">Resources</h1>
            <div className="course__resources-list">
              {course.resources.map((resource, index) => (
                <a
                  href={resource.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="course__resources-link"
                  key={index}
                >
                  <span className="course__resources-text">
                    {resource.name}
                  </span>
                  <ExternalLink />
                </a>
              ))}
            </div>
          </div>
        )}

        {course.quiz && course.quiz.length > 0 && (
          <div className="course__quiz" ref={quizRef}>
            <div className="course__quiz-header">
              <h1 className="course__quiz-heading">Quiz</h1>
            </div>
            <Quiz questions={course.quiz} onQuizPassed={handleQuizPassed} />
          </div>
        )}

        {checkCourseCompleted && (
          <div
            className="course__certificate"
            style={{
              textAlign: "center",
              marginTop: "40px",
              paddingBottom: "50px",
            }}
          >
            <button
              onClick={generateCertificate}
              style={{
                backgroundColor: "#0070f3",
                color: "white",
                padding: "15px 30px",
                fontSize: "1.2rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: "bold",
              }}
            >
              <Award size={24} />
              Download Certificate
            </button>
          </div>
        )}

        <Toaster position="bottom-right" />
      </div>
    </>
  );
}

export const getStaticPaths = async () => {
  const { connect } = await import("../../utils/db");
  const Course = (await import("../../models/Course")).default;
  await connect();
  const courses = await Course.find({}, "course");
  const paths = JSON.parse(JSON.stringify(courses)).map((c) => ({
    params: { course: c.course },
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps = async (context) => {
  const { connect } = await import("../../utils/db");
  const Course = (await import("../../models/Course")).default;
  await connect();
  const courseID = context.params.course;
  const course = await Course.findOne({ course: courseID });
  if (!course) return { notFound: true };
  return {
    props: { course: JSON.parse(JSON.stringify(course)) },
    revalidate: 60,
  };
};

export default CoursePage;
