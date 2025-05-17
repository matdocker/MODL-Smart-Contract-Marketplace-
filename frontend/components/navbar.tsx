// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow dark:bg-darkSurface">
      <Link href="/" className="text-xl font-bold">
        MODULR
      </Link>
      <div className="flex gap-4">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/templates" className="hover:underline">
          Templates
        </Link>
        <Link href="/audit" className="hover:underline">
          Audit
        </Link>
      </div>
    </nav>
  );
}
