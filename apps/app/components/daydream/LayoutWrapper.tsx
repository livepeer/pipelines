export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col w-full h-full">{children}</div>;
}
