import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save } from "react-feather";
import AdminLayout from "./AdminLayout";
import QuizBuilder from "./QuizBuilder";

/**
 * Shared course form for both create (/admin/courses/new)
 * and edit (/admin/courses/[id]) pages.
 *
 * @param {{ initial: object|null, courseSlug: string|null }} props
 */
export function CourseForm({ initial = null, courseSlug = null }) {
  const router = useRouter();
  const isEdit = !!courseSlug;

  const [form, setForm] = useState({
    name: initial?.name || "",
    course: initial?.course || "",
    description: initial?.description || "",
    image: initial?.image || "",
    ytURL: initial?.ytURL || "",
    status: initial?.status || "published",
  });
  const [resources, setResources] = useState(initial?.resources || [{ name: "", url: "" }]);
  const [quiz, setQuiz] = useState(initial?.quiz || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Auto-generate slug from name (create mode only)
  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      course: isEdit ? prev.course : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const addResource = () => setResources((r) => [...r, { name: "", url: "" }]);
  const removeResource = (i) => setResources((r) => r.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const cleanedResources = resources.filter((r) => r.name && r.url);
    const payload = { ...form, resources: cleanedResources, quiz };

    try {
      const url = isEdit ? `/api/admin/courses/${courseSlug}` : "/api/admin/courses";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Something went wrong");
      router.push("/admin/courses");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>{isEdit ? `Edit: ${initial?.name}` : "Create New Course"}</h1>
        <p>{isEdit ? "Update course details and quiz." : "Fill in the details to publish a new course."}</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form" noValidate>
        {/* ── Basic Info ── */}
        <div className="admin-form__section">
          <p className="admin-form__section-title">Basic Information</p>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="name">Course Title *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. TypeScript Crash Course"
                required
              />
            </div>
            <div className="admin-form-group">
              <label htmlFor="course">Slug *</label>
              <input
                id="course"
                name="course"
                type="text"
                value={form.course}
                onChange={handleChange}
                placeholder="e.g. typescript"
                aria-describedby="slug-hint"
                required
              />
              <span id="slug-hint" className="form-hint">
                {isEdit ? "⚠️ Changing the slug will break existing course links." : "Auto-generated. Lowercase, hyphens only."}
              </span>
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description shown on course cards…"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="image">Image Filename</label>
              <input
                id="image"
                name="image"
                type="text"
                value={form.image}
                onChange={handleChange}
                placeholder="e.g. typescript.svg"
              />
              <span className="form-hint">Place the file in /public/images/</span>
            </div>
            <div className="admin-form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Video ── */}
        <div className="admin-form__section">
          <p className="admin-form__section-title">Video Content</p>
          <div className="admin-form-group">
            <label htmlFor="ytURL">YouTube URL</label>
            <input
              id="ytURL"
              name="ytURL"
              type="url"
              value={form.ytURL}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <span className="form-hint">Full YouTube video URL — supports both youtube.com and youtu.be formats.</span>
          </div>
        </div>

        {/* ── Resources ── */}
        <div className="admin-form__section">
          <p className="admin-form__section-title">Resources</p>
          {resources.map((r, i) => (
            <div key={i} className="admin-form-row" style={{ marginBottom: "0.75rem", alignItems: "flex-end" }}>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`res-name-${i}`}>{i === 0 ? "Resource Name" : ""}</label>
                <input
                  id={`res-name-${i}`}
                  type="text"
                  value={r.name}
                  onChange={(e) => updateResource(i, "name", e.target.value)}
                  placeholder="e.g. MDN Documentation"
                />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`res-url-${i}`}>{i === 0 ? "URL" : ""}</label>
                <input
                  id={`res-url-${i}`}
                  type="url"
                  value={r.url}
                  onChange={(e) => updateResource(i, "url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <button
                type="button"
                className="btn-admin-danger"
                onClick={() => removeResource(i)}
                style={{ marginBottom: 0, flexShrink: 0 }}
                aria-label={`Remove resource ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn-admin-secondary" onClick={addResource} style={{ fontSize: "0.8rem" }}>
            + Add Resource
          </button>
        </div>

        {/* ── Quiz ── */}
        <div className="admin-form__section">
          <p className="admin-form__section-title">Quiz ({quiz.length} questions)</p>
          <QuizBuilder initialQuestions={quiz} onChange={setQuiz} />
        </div>

        {/* ── Actions ── */}
        <div className="admin-form__actions">
          <button type="submit" className="btn-admin-primary" disabled={saving} aria-label="Save course">
            <Save size={15} />
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </button>
          <Link href="/admin/courses">
            <a className="btn-admin-secondary">
              <ArrowLeft size={15} /> Cancel
            </a>
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
