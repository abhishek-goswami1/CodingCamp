import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError("Failed to load stats."); setLoading(false); });
  }, []);

  return (
    <AdminLayout>
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display-lg text-display-lg text-stone-900 mb-2">Welcome back, Admin!</h1>
          <p className="font-body-lg text-body-lg text-stone-600">Here's what's happening at miniCodeCamp today.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border-2 border-stone-900 shadow-[4px_4px_0_0_rgba(28,25,23,1)] font-label-lg text-label-lg flex items-center gap-2 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
            <span className="material-symbols-outlined">download</span>
            Export Data
          </button>
        </div>
      </section>

      {error && <div className="p-4 mb-8 text-white bg-red-600 rounded-md shadow">{error}</div>}

      {loading ? (
        <div className="text-stone-600 font-label-lg flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          Loading stats…
        </div>
      ) : (
        <>
          {/* Metrics Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Metric Card 1 */}
            <div className="bg-[#ede1d0] p-8 border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)]">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-4xl text-[#EE3F46]">person</span>
                <span className="bg-red-100 text-primary px-3 py-1 border border-stone-900 font-label-sm text-label-sm">+12%</span>
              </div>
              <p className="font-label-md text-label-md uppercase tracking-widest text-stone-600 mb-1">Total Students</p>
              <h3 className="font-display-md text-display-md text-stone-900">{stats?.totalUsers || 0}</h3>
            </div>
            {/* Metric Card 2 */}
            <div className="bg-white p-8 border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)]">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-4xl text-stone-900">bolt</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 border border-stone-900 font-label-sm text-label-sm">+5.2%</span>
              </div>
              <p className="font-label-md text-label-md uppercase tracking-widest text-stone-600 mb-1">Active Learners</p>
              <h3 className="font-display-md text-display-md text-stone-900">{stats?.activeLearners || 0}</h3>
            </div>
            {/* Metric Card 3 */}
            <div className="bg-[#e5e2db] p-8 border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)]">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-4xl text-stone-900">workspace_premium</span>
                <span className="bg-red-100 text-primary px-3 py-1 border border-stone-900 font-label-sm text-label-sm">+24%</span>
              </div>
              <p className="font-label-md text-label-md uppercase tracking-widest text-stone-600 mb-1">Course Completions</p>
              <h3 className="font-display-md text-display-md text-stone-900">{stats?.totalCompletions || 0}</h3>
            </div>
          </section>

          {/* Split View: Activity & Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Activity Table Container */}
            <div className="xl:col-span-8 bg-white border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)] overflow-hidden">
              <div className="px-8 py-6 border-b-2 border-stone-900 bg-[#FFFDF5] flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md">Recent Student Completions</h2>
                <Link href="/admin/users">
                  <a className="font-label-md text-label-md text-[#EE3F46] hover:underline underline-offset-4">View All</a>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b-2 border-stone-900">
                    <tr>
                      <th className="px-8 py-4 font-label-lg text-label-lg uppercase text-stone-500">Student ID</th>
                      <th className="px-8 py-4 font-label-lg text-label-lg uppercase text-stone-500">Courses Completed</th>
                      <th className="px-8 py-4 font-label-lg text-label-lg uppercase text-stone-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-stone-100">
                    {stats?.recentCompletions?.length > 0 ? (
                      stats.recentCompletions.map((u, i) => (
                        <tr key={u._id || i}>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-stone-400">account_circle</span>
                              <span className="font-body-md font-bold text-sm" style={{ fontFamily: "monospace" }}>{u.user}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 font-body-md font-bold">{u.courses?.filter((c) => c.completed).length || 0} courses</td>
                          <td className="px-8 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-800 border border-stone-900 text-xs font-bold rounded-full">Completed</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-8 py-4 text-stone-500 font-body-md italic text-center">
                          No recent completions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Container */}
            <div className="xl:col-span-4 flex flex-col gap-8">
              {/* Create Course Card */}
              <div className="bg-primary text-white border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)] p-8">
                <h3 className="font-headline-md text-headline-md mb-4 leading-tight">Launch a new curriculum today</h3>
                <p className="font-body-md mb-6 opacity-90">Ready to expand the library? Create a structured path for new students.</p>
                <Link href="/admin/courses/new">
                  <a className="w-full py-4 bg-white text-stone-900 font-bold border-2 border-stone-900 shadow-[4px_4px_0_0_rgba(28,25,23,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add_box</span>
                    Create New Course
                  </a>
                </Link>
              </div>

              {/* Growth Graph Decorative Card */}
              <div className="bg-white border-2 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,1)] p-8 relative overflow-hidden h-48">
                <div className="relative z-10">
                  <p className="font-label-sm text-label-sm uppercase tracking-widest text-stone-500 mb-1">Weekly Growth</p>
                  <h4 className="font-headline-md text-headline-md text-stone-900">+{stats?.totalUsers ? Math.ceil(stats.totalUsers * 0.12) : 0} Students</h4>
                </div>
                {/* Faux decorative graph */}
                <div className="absolute bottom-0 left-0 w-full h-24 flex items-end gap-1 px-4 opacity-20">
                  <div className="bg-primary w-full h-[40%]"></div>
                  <div className="bg-primary w-full h-[60%]"></div>
                  <div className="bg-primary w-full h-[50%]"></div>
                  <div className="bg-primary w-full h-[80%]"></div>
                  <div className="bg-primary w-full h-[95%]"></div>
                  <div className="bg-primary w-full h-[70%]"></div>
                  <div className="bg-primary w-full h-[85%]"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
