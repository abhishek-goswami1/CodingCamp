import { useState, useEffect } from "react";

import { useClerk } from "@clerk/nextjs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { Lock, Unlock } from "react-feather";
import toast, { Toaster } from "react-hot-toast";

function Dashboard() {
  const { user } = useClerk();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [totalCourses, setTotalCourses] = useState(null);

  // Guard: don't render anything until Clerk has loaded the user
  if (!user) {
    return <div className="dashboard"><div className="spinner"></div></div>;
  }

  const downloadPDF = async () => {
    const userName = user?.fullName || user?.firstName || "Student";
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
    saveAs(uri, "thecodingcamp-certificate.pdf", { autoBom: true });
  };

  // Map course slugs to their actual image filenames in /public/images/
  const courseImageMap = {
    html: "html.svg",
    hrml: "html.svg", // typo slug fallback
    css: "css.svg",
    git: "git.svg",
    js: "js.svg",
    javascript: "js.svg",
    react: "react.svg",
    node: "node.svg",
    nodejs: "node.svg",
    mongodb: "mongodb.svg",
    "how-website-works": "web.svg",
    "1min": "web.svg",
  };

  useEffect(() => {
    if (!user?.id) return; // wait for Clerk to load
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch user progress and total published course count in parallel
        const [userRes, countRes] = await Promise.all([
          fetch(`/api/user/${user.id}`, { cache: "no-store" }),
          fetch(`/api/courses/count`, { cache: "no-store" }),
        ]);

        const userData = await userRes.json();
        const { count: total } = await countRes.json();
        setTotalCourses(total);

        // Check local storage for any immediate frontend-only completions
        const localKey = `mcc_completed_${user.id}`;
        const localCompletedSlugs = JSON.parse(localStorage.getItem(localKey) || "[]");

        let completedCourses = userData[0]?.courses?.filter(
          (course) => course.completed === true
        ) ?? [];

        // Merge local state that might not be synced to API yet
        localCompletedSlugs.forEach((slug) => {
          if (!completedCourses.find((c) => c.course === slug)) {
             completedCourses.push({ course: slug, completed: true });
          }
        });

        // Unlock certificate when ALL published courses are completed
        if (total > 0 && completedCourses.length >= total) {
          setDisabled(false);
          toast("Achievement Unlocked 🏆 ", {
            id: "certificate",
            duration: 5000,
            style: {
              fontSize: "1.2rem",
              fontWeight: "600",
              backgroundColor: "#212529",
              color: "#fff",
            },
          });
        }

        setCourses(completedCourses);
        if (!completedCourses.length) setNoData(true);
        else setNoData(false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]); // re-run whenever Clerk user becomes available

  return (
    <div className="dashboard">
      <div className="dashboard__completed">
        <h1 className="dashboard__completed-heading">
          Completed <span style={{ color: "#ec3944" }}>Courses</span>
        </h1>

        {totalCourses !== null && (
          <p className="dashboard__progress-label">
            {courses.length} / {totalCourses} courses completed
          </p>
        )}

        {loading ? (
          <div className="spinner"></div>
        ) : noData ? (
          <p>You don&apos;t have any completed courses yet.</p>
        ) : (
          <div className="dashboard__completed-courses">
            {courses.map((course, index) => {
              const imgFile = courseImageMap[course.course] ?? `${course.course}.svg`;
              return (
                <div key={index} className="dashboard__course">
                  <p className="dashboard__course-title">
                    {course.course.toUpperCase()}
                  </p>
                  <img
                    src={`/images/${imgFile}`}
                    alt={course.course}
                    width="50"
                    height="50"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dashboard__certificate">
        <h1 className="dashboard__certificate-heading">
          <span className="dashboard__certificate-heading--main">
            Certificate of <span style={{ color: "#ec3944" }}>Completion</span>
          </span>
          <span className="dashboard__certificate-heading--sub">
            Complete all the courses and unlock your certificate.
          </span>
        </h1>
        <button
          className={`dashboard__certificate-btn ${disabled ? "disabled" : ""}`}
          disabled={disabled}
          onClick={downloadPDF}
          aria-label={disabled ? "Certificate locked — complete all courses" : "Download your certificate"}
        >
          <span className="dashboard__certificate-btn--text">
            Download Certificate
          </span>
          {disabled ? <Lock /> : <Unlock />}
        </button>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default Dashboard;
