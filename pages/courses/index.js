import { useEffect, useState } from "react";

import { useRouter } from "next/router";
import { useClerk } from "@clerk/nextjs";
import { CheckCircle, Youtube } from "react-feather";
import toast from "react-hot-toast";

const toastStyles = {
  fontSize: "1.2rem",
  fontWeight: "600",
  backgroundColor: "#212529",
  color: "#fff",
};

function Courses({ courseList }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useClerk();

  const addCourse = async (slug) => {
    toast.loading("Loading...", { id: "loading", style: toastStyles });
    try {
      const res = await fetch(`/api/user/${user.id}`);
      const data = await res.json();
      if (data.length) {
        if (data[0].courses.some((course) => course.course === slug)) {
          router.push(`/courses/${slug}`);
          toast.remove("loading");
          return;
        }
        const updateRes = await fetch(`/api/user/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course: slug, completed: false }),
        });
        if (!updateRes.ok) throw new Error("Something went wrong");
        router.push(`/courses/${slug}`);
        toast.remove("loading");
        return;
      }
    } catch (err) {
      toast.remove("loading");
      toast.error(err.message, { id: "error", style: toastStyles });
      return;
    }

    try {
      const createRes = await fetch(`/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user.id,
          courses: [{ course: slug, completed: false }],
        }),
      });
      if (!createRes.ok) throw new Error("Something went wrong");
      router.push(`/courses/${slug}`);
      toast.remove("loading");
    } catch (err) {
      toast.remove("loading");
      toast.error(err.message, { id: "error", style: toastStyles });
    }
  };

  const BtnText = ({ text }) => (
    <span style={{ marginRight: "10px" }}>{text}</span>
  );

  useEffect(() => {
    setLoading(true);
    const getUserDetails = async () => {
      try {
        const res = await fetch(`/api/user/${user.id}`);
        const data = await res.json();
        
        let apiCourses = data.length ? data[0]?.courses : [];
        
        // Merge frontend-only local completions for immediate feedback
        const localKey = `mcc_completed_${user.id}`;
        const localCompletedSlugs = JSON.parse(localStorage.getItem(localKey) || "[]");
        
        localCompletedSlugs.forEach((slug) => {
          const existing = apiCourses.find(c => c.course === slug);
          if (existing) {
             existing.completed = true;
          } else {
             apiCourses.push({ course: slug, completed: true });
          }
        });

        setCourses(apiCourses);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };
    getUserDetails();
  }, []);

  return (
    <div className="courses">
      <div className="courses__text-box">
        <h1 className="courses__heading">
          <span className="courses__heading--main">Web</span>
          <span className="courses__heading--sub"> Development</span>
        </h1>
      </div>
      <div className="courses__section-grid">
        {courseList.map((course) => (
          <div className="courses__card" key={course.course}>
            <div className="courses__card-header">
              {course.ytURL ? (
                <img
                  src={`https://img.youtube.com/vi/${
                    course.ytURL.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] || ""
                  }/mqdefault.jpg`}
                  alt={course.name}
                  style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "6px", display: "block", marginBottom: "0.75rem" }}
                />
              ) : (
                <img
                  src={`/images/${course.image}`}
                  alt={course.name}
                  width="60"
                  height="60"
                  className="courses__card-logo"
                />
              )}
              <span className="courses__card-title">{course.name}</span>
            </div>

            <div className="courses__card-body">{course.description}</div>

            <div className="courses__card-footer">
              <button
                className="courses__card-btn completed"
                onClick={() => addCourse(course.course)}
              >
                {loading ? (
                  <div className="spinner light"></div>
                ) : courses
                    ?.filter((item) => item.course === course.course)
                    .some((item) => item.completed === true) ? (
                  <>
                    <BtnText text="Completed" />
                    <CheckCircle size={32} />
                  </>
                ) : courses?.some((item) => item.course === course.course) ? (
                  <>
                    <BtnText text="Resume Course" />
                    <Youtube size={38} />
                  </>
                ) : (
                  <>
                    <BtnText text="Start Course" />
                    <Youtube size={38} />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const { connect } = await import("../../utils/db");
  const Course = (await import("../../models/Course")).default;
  await connect();
  const courses = await Course.find({ status: "published" }).select(
    "course name description image -_id"
  ).sort({ createdAt: 1 });
  return {
    props: { courseList: JSON.parse(JSON.stringify(courses)) },
  };
}

export default Courses;
