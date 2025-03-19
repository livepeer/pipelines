export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen md:h-auto md:min-h-[calc(100vh-2rem)] flex-col w-full">
      {children}
    </div>
  );
}
