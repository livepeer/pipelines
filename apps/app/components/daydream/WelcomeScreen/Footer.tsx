import LivepeerLogo from "../LivepeerLogo";

export default function Footer() {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 w-full bg-white backdrop-blur-lg opacity-25 h-12 flex items-center justify-center gap-2"></div>
      <div className="absolute bottom-0 left-0 right-0 w-full bg-transparent h-12 flex items-center justify-center gap-2">
        <div className="text-sm text-[#707070] font-semibold">Powered by</div>
        <LivepeerLogo />
      </div>
    </>
  );
}
