import { Link } from "react-router-dom";
import type { ProcessStep } from "../data/servicesData";

interface ServiceProcessProps {
  title: string;
  intro?: string;
  steps: ProcessStep[];
}

const ServiceProcess = ({ title, intro, steps }: ServiceProcessProps) => {
  if (steps.length === 0 && !intro) return null;

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-comic text-3xl md:text-4xl text-center mb-4">{title}</h2>
        {intro && <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">{intro}</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {steps.map((step, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 shadow-md">
              <img src={step.icon} alt={step.subtitle || step.title} className="w-10 h-10 mb-4" />
              {step.title && <span className="text-comic text-primary text-sm">{step.title}</span>}
              {step.subtitle && <h3 className="text-comic text-lg mb-2">{step.subtitle}</h3>}
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/quote" className="btn-cta">Get Your Quote</Link>
        </div>
      </div>
    </section>
  );
};

export default ServiceProcess;
