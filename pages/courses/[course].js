import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/router";

import { useClerk } from "@clerk/nextjs";
import ReactPlayer from "react-player/youtube";
import toast, { Toaster } from "react-hot-toast";
import { ExternalLink, Award } from "react-feather";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";

import Quiz from "../../components/Quiz";

const toastStyles = {
  fontSize: "1.2rem",
  fontWeight: "600",
  backgroundColor: "#212529",
  color: "#fff",
};

function CoursePage({ course }) {
  const router = useRouter();
  const { user } = useClerk();
  
  const [checkCourseCompleted, setCheckCourseCompleted] = useState(false);
  const [maxPlayedSeconds, setMaxPlayedSeconds] = useState(0);
  const [initialSeekTime, setInitialSeekTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const lastSavedSecRef = useRef(0); // track last save to avoid duplicate API hits
  
  const playerRef = useRef(null);
  const quizRef = useRef(null);

  // Initialize progress and silence ReactPlayer warnings
  useEffect(() => {
    // Silence harmless ReactPlayer warnings in the console
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ReactPlayer: YouTube player could not call')) return;
      originalWarn.apply(console, args);
    };

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
              courses: [{ course: router.query.course, completed: false, videoProgress: 0 }],
            }),
          });
          return;
        }

        const courseObj = data[0].courses.find((c) => c.course === router.query.course);

        // Check local storage for immediate frontend state
        const localKey = `mcc_completed_${user.id}`;
        const localCompleted = JSON.parse(localStorage.getItem(localKey) || "[]");
        const isLocallyCompleted = localCompleted.includes(router.query.course);

        if (courseObj) {
          setCheckCourseCompleted(courseObj.completed || isLocallyCompleted);
          setMaxPlayedSeconds(courseObj.videoProgress || 0);
          // Auto-seek to where they left off
          if (courseObj.videoProgress > 0 && !courseObj.videoCompleted) {
            setInitialSeekTime(courseObj.videoProgress);
          }
        } else {
          if (isLocallyCompleted) setCheckCourseCompleted(true);
          await fetch(`/api/user/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course: router.query.course, completed: isLocallyCompleted }),
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
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          course: router.query.course,
          playedSeconds,
          duration
        }),
      });
      const data = await res.json();
      console.log(`[progress] status=${res.status} course=${router.query.course} played=${Math.floor(playedSeconds)}s`, data);
      if (!res.ok) {
        console.error("[progress] API error:", res.status, data);
        return;
      }
      if (data.completed) {
        setCheckCourseCompleted(true);
        toast.success("Course completely finished! 🎉", { style: toastStyles });
      }
    } catch (err) {
      console.error("Progress save failed", err);
    }
  };

  // Anti-skip logic
  const handleProgress = (state) => {
    // Only block progress tracking during an active seek scrub, NOT during normal pause
    if (isSeeking || !isReady || !duration) return;

    // Allow a 2-second buffer for natural playback drift.
    // If they scrub forward beyond their maximum allowed time, forcefully rewind.
    if (state.playedSeconds > maxPlayedSeconds + 2) {
      if (playerRef.current) playerRef.current.seekTo(maxPlayedSeconds, "seconds");
      toast("Skipping forward is disabled 🛑", { icon: "🛑" });
      return;
    }

    const newMax = Math.max(maxPlayedSeconds, state.playedSeconds);
    setMaxPlayedSeconds(newMax);

    // Save progress to DB roughly every 10 seconds to avoid spamming the API
    const flooredSec = Math.floor(state.playedSeconds);
    if (flooredSec > 0 && flooredSec % 10 === 0 && flooredSec !== lastSavedSecRef.current) {
      lastSavedSecRef.current = flooredSec;
      saveProgressToDB(state.playedSeconds, duration);
    }
  };

  // Save progress when user pauses — captures partial progress even if they don't finish
  const handlePause = () => {
    if (isReady && duration > 0 && maxPlayedSeconds > 0) {
      saveProgressToDB(maxPlayedSeconds, duration);
    }
  };

  const handleEnded = () => {
    // 1. Instantly mark course as completed on frontend
    setCheckCourseCompleted(true);
    toast.success("Course completely finished! 🎉", { style: toastStyles });

    // 2. Save completion state locally for immediate dashboard reflection
    const localKey = `mcc_completed_${user?.id || "guest"}`;
    const localCompleted = JSON.parse(localStorage.getItem(localKey) || "[]");
    if (!localCompleted.includes(router.query.course)) {
      localCompleted.push(router.query.course);
      localStorage.setItem(localKey, JSON.stringify(localCompleted));
    }

    // 3. Scroll to quiz if available
    if (course.quiz && course.quiz.length > 0 && !checkCourseCompleted) {
       toast("Video done! Scroll down to pass the quiz.", { style: toastStyles });
       quizRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // 4. Background Sync: send completion to backend API for persistent storage
    if (duration > 0) {
      saveProgressToDB(duration, duration); // Save 100%
    }
  };

  // Force re-evaluation of completion when quiz is passed
  const handleQuizPassed = async () => {
    if (duration > 0) {
      // Triggering progress save again will re-evaluate video+quiz completion on the backend
      await saveProgressToDB(maxPlayedSeconds, duration);
    }
  };

  const handleReady = () => {
    setIsReady(true);
    if (initialSeekTime > 0 && playerRef.current) {
      playerRef.current.seekTo(initialSeekTime, "seconds");
      setInitialSeekTime(0); // Prevent seeking again on subsequent ready events
    }
  };

  const generateCertificate = async () => {
    const userName = user?.fullName || user?.firstName || "Student";
    try {
      const existingPdfBytes = await fetch("/certificate.pdf").then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      firstPage.drawText(userName, {
        x: 300,
        y: 300,
        size: 40,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
      });

      const uri = await pdfDoc.saveAsBase64({ dataUri: true });
      saveAs(uri, `${course.course}-certificate.pdf`, { autoBom: true });
    } catch (err) {
      console.error("Failed to generate certificate", err);
      toast.error("Failed to generate certificate", { style: toastStyles });
    }
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
            onDuration={(d) => setDuration(d)}
            onProgress={handleProgress}
            onSeek={() => setIsSeeking(true)}  
            onPlay={() => setIsSeeking(false)} 
            onPause={handlePause}              
            onEnded={handleEnded}
            progressInterval={1000} 
            config={{
              youtube: {
                playerVars: {
                  origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                }
              }
            }}
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
                  <span className="course__resources-text">{resource.name}</span>
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
          <div className="course__certificate" style={{ textAlign: "center", marginTop: "40px", paddingBottom: "50px" }}>
             <button 
                onClick={generateCertificate}
                className="bg-[#ec3944] text-white font-bold py-3 px-6 rounded-none border-2 border-[#1c1917] shadow-[4px_4px_0_0_rgba(28,25,23,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all inline-flex items-center gap-3 text-xl"
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
