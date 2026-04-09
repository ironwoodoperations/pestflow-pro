import { FAQ } from "../data/servicesData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";

interface ServiceFAQsProps {
  faqs: FAQ[];
}

const ServiceFAQs = ({ faqs }: ServiceFAQsProps) => (
  <section className="py-16 bg-muted">
    <div className="container mx-auto px-4 max-w-3xl">
      <h2 className="text-comic text-3xl md:text-4xl text-center mb-8">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default ServiceFAQs;
