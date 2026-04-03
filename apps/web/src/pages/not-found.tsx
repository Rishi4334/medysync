import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The route you requested does not exist.</p>
      <Link href="/dashboard" className="mt-6 rounded-xl bg-teal-600 px-4 py-2 text-white">
        Go to dashboard
      </Link>
    </div>
  );
}
