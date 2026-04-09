interface ExtraSectionProps {
  section: {
    title: string;
    content: string[];
    image?: string;
    imageAlt?: string;
    bulletPoints?: string[];
  };
  index: number;
}

const renderBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
};

const ServiceExtraSection = ({ section, index }: ExtraSectionProps) => {
  const isEven = index % 2 === 0;

  return (
    <section className={`py-16 ${isEven ? "bg-background" : "bg-muted"}`}>
      <div className="container mx-auto px-4">
        <div className={`grid md:grid-cols-${section.image ? "2" : "1"} gap-12 items-start`}>
          <div className={section.image && !isEven ? "md:order-2" : ""}>
            <h2 className="text-comic text-3xl mb-6">{section.title}</h2>
            {section.content.map((paragraph, i) => (
              <p key={i} className="text-muted-foreground mb-4 leading-relaxed">
                {renderBoldText(paragraph)}
              </p>
            ))}
            {section.bulletPoints && (
              <ul className="space-y-2 mt-4">
                {section.bulletPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground text-sm">
                    <span>•</span>
                    <span>{renderBoldText(point)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {section.image && (
            <div className={!isEven ? "md:order-1" : ""}>
              <img
                src={section.image}
                alt={section.imageAlt || section.title}
                className="w-full rounded-2xl shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ServiceExtraSection;
