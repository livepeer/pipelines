import { BentoGrids } from "./BentoGrids";
import Header from "./Header";

export default async function Explore() {
  return (
    <>
      <div className="bg-gray-50 relative isolate">
        <Header />
        <BentoGrids />
      </div>
    </>
  );
}
