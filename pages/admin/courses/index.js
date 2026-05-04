import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Archive, Eye } from "react-feather";
import AdminLayout from "../../../components/admin/AdminLayout";

const PAGE_SIZE = 20;

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/courses?${params}`);
      const data = await res.json();
      setCourses(data.courses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [page, statusFilter]);
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCourses(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleArchive = async (course, currentStatus) => {
    const nextStatus = currentStatus === "archived" ? "published" : "archived";
    const label = nextStatus === "archived" ? "Archive" : "Restore";
    if (!confirm(`${label} "${course.name}"?`)) return;
    setArchiving(course.course);
    try {
      await fetch(`/api/admin/courses/${course.course}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchCourses();
    } catch {
      setError("Failed to update course status.");
    } finally {
      setArchiving(null);
    }
  };

  const statusBadge = (status) => (
    <span className={`badge badge--${status}`}>{status}</span>
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Courses</h1>
        <p>Manage all courses on The Coding Camp.</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <Search size={15} style={{ color: "#475569", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search courses"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: "8px", color: "#e2e8f0", padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <div className="admin-table-toolbar__actions">
            <Link href="/admin/courses/new">
              <a className="btn-admin-primary" aria-label="Create new course">
                <Plus size={15} /> New Course
              </a>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : courses.length === 0 ? (
          <div className="admin-empty">
            <h3>No courses found</h3>
            <p>Try adjusting your search or filter.</p>
            <Link href="/admin/courses/new">
              <a className="btn-admin-primary"><Plus size={15} /> Create First Course</a>
            </Link>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.course}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {course.ytURL ? (
                          <img
                            src={`https://img.youtube.com/vi/${
                              course.ytURL.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] || ""
                            }/mqdefault.jpg`}
                            alt={course.name}
                            width={80}
                            height={45}
                            style={{ borderRadius: "4px", objectFit: "cover", border: "1px solid #1e2535", flexShrink: 0 }}
                          />
                        ) : (
                          <img src={`/images/${course.image}`} alt="" width={28} height={28} style={{ borderRadius: "4px" }} />
                        )}
                        <strong style={{ color: "#f1f5f9" }}>{course.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>
                      {course.course}
                    </td>
                    <td>{statusBadge(course.status)}</td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/courses/${course.course}`}>
                          <a className="btn-admin-icon" target="_blank" aria-label={`Preview ${course.name}`}>
                            <Eye size={13} />
                          </a>
                        </Link>
                        <Link href={`/admin/courses/${course.course}`}>
                          <a className="btn-admin-icon" aria-label={`Edit ${course.name}`}>
                            <Edit2 size={13} /> Edit
                          </a>
                        </Link>
                        <button
                          className="btn-admin-danger"
                          onClick={() => handleArchive(course, course.status)}
                          disabled={archiving === course.course}
                          aria-label={course.status === "archived" ? `Restore ${course.name}` : `Archive ${course.name}`}
                        >
                          <Archive size={13} />
                          {course.status === "archived" ? "Restore" : "Archive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-pagination">
              <span className="admin-pagination__info">
                {total} course{total !== 1 ? "s" : ""} found
              </span>
              <button
                className="btn-admin-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {page} / {pages}
              </span>
              <button
                className="btn-admin-secondary"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
