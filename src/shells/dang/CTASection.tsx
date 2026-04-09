import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

const locations = [
  { name: "Longview", slug: "longview-tx" },
  { name: "Jacksonville", slug: "jacksonville-tx" },
  { name: "Lindale", slug: "lindale-tx" },
  { name: "Bullard", slug: "bullard-tx" },
  { name: "Whitehouse", slug: "whitehouse-tx" },
];

const CTASection = () => {
  return (
    <section className="relative text-white text-center">
      <div className="relative">
        <img
          src="/cta-bg.png"
          alt=""
          width="1200"
          height="600"
          className="w-full block"
        />
        <div
          className="absolute left-0 right-0"
          style={{ top: '12%' }}
        >
          <div className="mx-auto px-4" style={{ maxWidth: '600px' }}>
            <h2
              className="text-comic uppercase mb-3"
              style={{
                color: 'hsl(48, 100%, 50%)',
                fontSize: 'clamp(24px, 3.5vw, 44px)',
                WebkitTextStroke: '1.5px hsl(20, 40%, 12%)',
                paintOrder: 'stroke fill',
                textShadow: '-2px -2px 0 hsl(20,40%,12%), 2px -2px 0 hsl(20,40%,12%), -2px 2px 0 hsl(20,40%,12%), 2px 2px 0 hsl(20,40%,12%)',
              }}
            >
              Get Your Quote Today
            </h2>
            <p
              className="mb-5 text-white mx-auto"
              style={{ fontSize: '14px', lineHeight: '1.6', maxWidth: '480px' }}
            >
              Don't wait—restore comfort and peace to your home with professional pest control services from Dang Pest Control. Located in Tyler, TX, we proudly serve the surrounding areas, including{" "}
              {locations.map((loc, i) => (
                <span key={loc.slug}>
                  <Link to={`/${loc.slug}`} className="underline text-white hover:opacity-75 transition-opacity">{loc.name}</Link>
                  {i < locations.length - 1 ? ", " : ""}
                </span>
              ))}{" "}
              and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="tel:9038710550"
                className="inline-flex items-center gap-2 font-bold rounded-full px-6 py-2.5 text-sm border-2 border-white text-white transition-all hover:bg-white hover:text-orange-500"
              >
                <Phone className="w-4 h-4" /> (903) 871-0550
              </a>
              <Link
                to="/quote"
                className="inline-flex items-center justify-center font-bold rounded-full px-6 py-2.5 text-sm transition-all"
                style={{
                  background: 'white',
                  color: 'hsl(28, 100%, 50%)',
                  border: '2px solid hsl(20, 40%, 12%)',
                }}
              >
                Get Your Quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
