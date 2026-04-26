import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Shield, UserX } from "react-feather";
import AdminLayout from "../../../components/admin/AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleRoleToggle = async (clerkId, currentRole) => {
    const nextRole = currentRole === "admin" ? "learner" : "admin";
    const label = nextRole === "admin" ? "promote to admin" : "demote to learner";
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;

    setUpdating(clerkId);
    try {
      const res = await fetch(`/api/admin/users/${clerkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const completionRate = (u) => {
    if (!u.coursesStarted) return "—";
    return `${Math.round((u.coursesCompleted / u.coursesStarted) * 100)}%`;
  };

  return (
    <AdminLayout>
      <div className="admin-page-header ">
        <h1 >Users</h1>
        <p>View learner progress and manage roles.</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: "8px", color: "#e2e8f0", padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="learner">Learners</option>
            <option value="admin">Admins</option>
          </select>
          <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "0.8rem" }}>
            {total} user{total !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <h3>No users found</h3>
            <p>Users appear here once they sign in for the first time.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Clerk User ID</th>
                  <th>Role</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Quizzes</th>
                  <th>Completion Rate</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.clerkId}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#94a3b8" }}>
                      {u.clerkId?.slice(0, 24)}…
                    </td>
                    <td>
                      <span className={`badge badge--${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.coursesStarted}</td>
                    <td>{u.coursesCompleted}</td>
                    <td>{u.quizzesTaken}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {completionRate(u)}
                        {u.coursesStarted > 0 && (
                          <div className="admin-progress-bar" style={{ width: 60 }}>
                            <div
                              className="admin-progress-bar__fill"
                              style={{ width: `${(u.coursesCompleted / u.coursesStarted) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/admin/users/${u.clerkId}`}>
                          <a className="btn-admin-icon" aria-label="View user progress">
                            <Eye size={13} /> View
                          </a>
                        </Link>
                        <button
                          className={u.role === "admin" ? "btn-admin-danger" : "btn-admin-secondary"}
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                          onClick={() => handleRoleToggle(u.clerkId, u.role)}
                          disabled={updating === u.clerkId}
                          aria-label={u.role === "admin" ? "Demote to learner" : "Promote to admin"}
                        >
                          {u.role === "admin" ? <UserX size={12} /> : <Shield size={12} />}
                          {updating === u.clerkId ? "…" : u.role === "admin" ? "Demote" : "Promote"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div className="admin-pagination">
                <span className="admin-pagination__info">{total} users</span>
                <button className="btn-admin-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{page} / {pages}</span>
                <button className="btn-admin-secondary" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
