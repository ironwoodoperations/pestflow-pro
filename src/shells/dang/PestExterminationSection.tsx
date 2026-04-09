import { Link } from "react-router-dom";

const PestExterminationSection = () => {
  return (
    <section
      className="py-16"
      style={{
        background: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-bold text-3xl md:text-4xl mb-6" style={{ color: 'hsl(20, 40%, 12%)' }}>
            Pest Extermination & More near Tyler, TX
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'hsl(20, 20%, 30%)' }}>
            Pests don't wait, and neither should you! By working with Dang Pest Control, you're choosing a company that understands the unique environment and factors contributing to pest problems in East Texas. Whether it's termites threatening your property's value or disease-carrying pests like mosquitos, we have you covered.
          </p>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(20, 20%, 30%)' }}>
            By focusing not just on eliminating pests, but also identifying their harborage areas, access points, and conducive conditions, we effectively disrupt their life cycles, giving you long-term control and peace of mind.
          </p>
          <Link
            to="/quote"
            className="inline-flex items-center justify-center font-bold rounded-full px-8 py-3 text-white transition-all hover:brightness-110"
            style={{ backgroundColor: 'hsl(28, 100%, 50%)', fontSize: '1rem' }}
          >
            Get Your Quote
          </Link>
        </div>
        <div>
          <img
            src="/dang/exterior-treatment.jpg"
            alt="Pest Control Technician Applying Exterior Treatment"
            width="644"
            height="419"
            className="w-full rounded-2xl object-cover"
            style={{ border: '6px solid hsl(28, 100%, 50%)' }}
          />
        </div>
      </div>
    </section>
  );
};

export default PestExterminationSection;
