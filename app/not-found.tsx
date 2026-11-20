import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0B192C] text-[#F8FAFC] flex items-center justify-center px-6">
      <div className="max-w-md text-center rounded-xl bg-[#132743] border border-[#1E3A5F] p-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-[#CBD5E1] mb-6">
          The page you are looking for does not exist in this recommendation system.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#38BDF8] text-[#0B192C] text-sm font-semibold hover:bg-[#7DD3FC] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
