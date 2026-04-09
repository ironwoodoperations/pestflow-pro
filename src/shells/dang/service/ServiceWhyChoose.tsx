import { WhyChooseItem } from "../data/servicesData";
import { Link } from "react-router-dom";

interface ServiceWhyChooseProps {
  items: WhyChooseItem[];
  intro?: string;
}

const ServiceWhyChoose = ({ items, intro }: ServiceWhyChooseProps) => (
  <section className="section-orange text-primary-foreground py-16">
    <div className="container mx-auto px-4">
      <h2 className="text-comic text-3xl md:text-4xl text-center mb-4">Why Choose Us?</h2>
      {intro && <p className="text-center opacity-90 mb-12 max-w-3xl mx-auto">{intro}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4">
            <img src={item.icon} alt={item.title} className="w-10 h-10 flex-shrink-0" />
            <div>
              <h3 className="text-comic text-lg mb-2">{item.title}</h3>
              <p className="text-sm opacity-90">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/quote" className="btn-cta">Get Your Quote</Link>
      </div>
    </div>
  </section>
);

export default ServiceWhyChoose;
