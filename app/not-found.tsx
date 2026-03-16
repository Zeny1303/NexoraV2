import Link from "next/link";
import "./not-found.css";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        
        {/* Left Side: Visuals simulating 3D */}
        <div className="not-found-visuals">
          <div className="number-3d pink">4</div>
          <div className="emoji-center">😟</div>
          <div className="number-3d blue">4</div>
        </div>

        {/* Right Side: Text & CTA */}
        <div className="not-found-text-section">
          <h1 className="not-found-title">Whoops!</h1>
          <p className="not-found-desc">
            We seem to have lost this page. While we look for it, 
            let&apos;s get you started on a more fruitful search:
          </p>
          <Link href="/events" className="not-found-btn">
            Events
          </Link>
        </div>

      </div>
    </div>
  );
}
