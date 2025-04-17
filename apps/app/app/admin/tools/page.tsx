'use client';

import Link from 'next/link';

export default function AdminToolsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Tools</h1>
      <p className="mb-6 text-gray-600">Select a tool to get started.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/tools/clip-preview-generator">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-lg font-semibold mb-2 text-indigo-600">Clip Preview Generator</h2>
            <p className="text-sm text-gray-500">Generate short preview clips from uploaded videos.</p>
          </div>
        </Link>
      </div>
    </div>
  );
} 