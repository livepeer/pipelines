import Link from "next/link";

export function AdminCard({ title, description, link }: { title: string; description: string; link: string }) {
  return (
    <Link href={link}>
      <div className="bg-white shadow-md rounded-lg p-6 transition duration-200 hover:shadow-lg cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="text-indigo-600 font-medium">Manage →</div>
      </div>
    </Link>
  );
} 