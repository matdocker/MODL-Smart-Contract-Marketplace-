// components/MobileMenu.tsx
import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="md:hidden">
        ☰
      </button>
      {open && (
        <div className="absolute top-0 left-0 w-full bg-white shadow p-4 flex flex-col gap-3">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link href="/templates" onClick={() => setOpen(false)}>
            Templates
          </Link>
          <Link href="/audit" onClick={() => setOpen(false)}>
            Audit
          </Link>
        </div>
      )}
    </>
  );
}
