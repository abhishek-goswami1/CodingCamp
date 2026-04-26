import Head from "next/head";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users", label: "Students", icon: "group" },
  { href: "/admin/courses", label: "My Courses", icon: "school" },
  { href: "/admin/analytics", label: "Revenue", icon: "payments" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();
    await fetch("/api/admin/logout");
    router.push("/admin/login");
  };

  return (
    <>
      <Head>
        <style>{`
          .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          body { background-color: #fcf9f2; }
        `}</style>
      </Head>

      <div className="bg-[#fcf9f2] text-on-background font-body-md selection:bg-primary selection:text-white min-h-screen">
        {/* TopNavBar */}
        <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-20 bg-white border-b-4 border-stone-900 shadow-[0_4px_0_0_rgba(28,25,23,1)]">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black tracking-tighter text-stone-900 italic">The CodingCamp</span>
            <div className="hidden md:flex items-center gap-6 ml-8">
              <Link href="/admin">
                <a className="font-['Plus_Jakarta_Sans'] font-bold text-[#EE3F46] no-underline">Dashboard</a>
              </Link>
              <Link href="/admin/courses">
                <a className="font-['Plus_Jakarta_Sans'] font-bold text-stone-600 hover:text-stone-900 transition-all">Curriculum</a>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-stone-100 transition-all active:translate-y-0.5">
              <span className="material-symbols-outlined">local_fire_department</span>
            </button>
            <button className="p-2 hover:bg-stone-100 transition-all active:translate-y-0.5" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-stone-900 shadow-[2px_2px_0_0_rgba(28,25,23,1)] bg-[#EE3F46] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
          </div>
        </header>

        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 pt-24 pb-8 px-4 z-40 bg-[#FFFDF5] border-r-4 border-stone-900 shadow-[4px_0_0_0_rgba(28,25,23,1)]">
          <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? router.pathname === "/admin"
                  : router.pathname.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <a className={`flex items-center gap-3 px-4 py-3 border-2 transition-all font-['Plus_Jakarta_Sans'] font-extrabold text-sm uppercase tracking-wider no-underline ${isActive ? "bg-[#EE3F46] text-white border-stone-900 shadow-[4px_4px_0_0_rgba(28,25,23,1)] translate-x-[-2px] translate-y-[-2px]" : "text-stone-900 border-transparent hover:bg-red-50 hover:border-stone-900"}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {item.label}
                  </a>
                </Link>
              );
            })}
            <Link href="/courses">
              <a className="flex items-center gap-3 px-4 py-3 text-stone-900 border-2 border-transparent hover:bg-red-50 hover:border-stone-900 transition-all font-['Plus_Jakarta_Sans'] font-extrabold text-sm uppercase tracking-wider no-underline">
                <span className="material-symbols-outlined">exit_to_app</span>
                View Site
              </a>
            </Link>
          </nav>
          <Link href="/admin/courses/new">
            <button className="mt-auto w-full py-4 bg-[#EE3F46] text-white font-bold border-2 border-stone-900 shadow-[4px_4px_0_0_rgba(28,25,23,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">add_circle</span>
              New Course
            </button>
          </Link>
        </aside>

        {/* Main Content Canvas */}
        <main className="lg:ml-64 pt-24 pb-20 px-6 md:px-12">
          {children}
        </main>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white border-t-4 border-stone-900 rounded-t-2xl shadow-[0_-4px_0_0_rgba(28,25,23,1)]">
          <Link href="/admin">
            <a className={`flex flex-col items-center justify-center ${router.pathname === "/admin" ? "bg-red-100 text-[#EE3F46] border-2 border-stone-900 rounded-xl px-4 py-1 shadow-[2px_2px_0_0_rgba(28,25,23,1)]" : "text-stone-500 hover:text-stone-900"}`}>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[10px]">Learn</span>
            </a>
          </Link>
          <Link href="/admin/users">
            <a className={`flex flex-col items-center justify-center ${router.pathname.startsWith("/admin/users") ? "bg-red-100 text-[#EE3F46] border-2 border-stone-900 rounded-xl px-4 py-1 shadow-[2px_2px_0_0_rgba(28,25,23,1)]" : "text-stone-500 hover:text-stone-900"}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[10px]">Students</span>
            </a>
          </Link>
          <Link href="/admin/courses">
            <a className={`flex flex-col items-center justify-center ${router.pathname.startsWith("/admin/courses") ? "bg-red-100 text-[#EE3F46] border-2 border-stone-900 rounded-xl px-4 py-1 shadow-[2px_2px_0_0_rgba(28,25,23,1)]" : "text-stone-500 hover:text-stone-900"}`}>
              <span className="material-symbols-outlined">school</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[10px]">Courses</span>
            </a>
          </Link>
          <Link href="/admin/analytics">
            <a className={`flex flex-col items-center justify-center ${router.pathname.startsWith("/admin/analytics") ? "bg-red-100 text-[#EE3F46] border-2 border-stone-900 rounded-xl px-4 py-1 shadow-[2px_2px_0_0_rgba(28,25,23,1)]" : "text-stone-500 hover:text-stone-900"}`}>
              <span className="material-symbols-outlined">payments</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[10px]">Revenue</span>
            </a>
          </Link>
        </nav>
      </div>
    </>
  );
}
