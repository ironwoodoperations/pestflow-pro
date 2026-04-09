import { Link } from "react-router-dom";

const services = [
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/General.jpg", name: "General Pest Control", slug: "pest-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Termite.jpg", name: "Termite Control & Inspections", slug: "termite-inspections" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/ant.jpg", name: "Ant Pest Control", slug: "ant-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/spider.jpg", name: "Spider Pest Control", slug: "spider-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Wasps-Hornet.jpg", name: "Wasp & Hornet Control", slug: "wasp-hornet-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Scorpion.jpg", name: "Scorpion Pest Control", slug: "scorpion-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Rodent.jpg", name: "Rodent Pest Control", slug: "rodent-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Mosquito.jpg", name: "Mosquito Pest Control", slug: "mosquito-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Flea.jpg", name: "Flea & Tick Control", slug: "flea-tick-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Roach.jpg", name: "Roach Pest Control", slug: "roach-control" },
  { img: "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/Bed-Bug.jpg", name: "Bed Bug Pest Control", slug: "bed-bug-control" },
];

const ServicesSection = () => {
  return (
    <section
      className="py-16"
      style={{
        background: 'hsl(45, 95%, 60%)',
        backgroundImage: 'url(https://www.dangpestcontrol.com/wp-content/uploads/2025/03/background-pest-control.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      }}
    >
      <div className="container mx-auto px-4">
        <p className="text-comic text-sm text-center mb-2 italic" style={{ color: 'hsl(28, 100%, 50%)' }}>
          OUR SERVICES
        </p>
        <h2 className="text-comic text-4xl md:text-5xl text-center mb-3 uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>
          Our Pest Control Services
        </h2>
        <p className="text-center text-sm mb-10 max-w-2xl mx-auto" style={{ color: 'hsl(20, 30%, 20%)' }}>
          Using the latest industry techniques, we deliver tailored treatment plans that are highly effective while remaining friendly for your family, pets, and the environment.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {services.map((service) => (
            <Link
              key={service.slug}
              to={`/${service.slug}`}
              className="flex flex-col items-center gap-3 text-center group"
            >
              <img
                src={service.img}
                alt={service.name}
                className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
              />
              <h3 className="text-comic text-sm uppercase" style={{ color: 'hsl(20, 40%, 12%)' }}>
                {service.name}
              </h3>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/quote"
            className="inline-flex items-center justify-center font-bold rounded-full px-10 py-3 text-white text-base transition-all"
            style={{ backgroundColor: 'hsl(28, 100%, 50%)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(48, 100%, 50%)'; e.currentTarget.style.color = 'hsl(20, 40%, 12%)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'hsl(28, 100%, 50%)'; e.currentTarget.style.color = 'white'; }}
          >
            Get Your Quote
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
