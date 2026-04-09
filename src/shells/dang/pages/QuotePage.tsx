import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "../ShellNavbar";
import Footer from "../ShellFooter";
import SEO from "../SEO";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../../lib/supabase";
import QuoteForm, { QuoteFormData } from "./QuoteForm";

const quoteSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(7, "Phone number is required").max(20),
  address: z.string().trim().min(1, "Address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(50),
  zip: z.string().trim().min(5, "ZIP code is required").max(10),
  services: z.array(z.string()).min(1, "Select at least one service"),
  message: z.string().trim().max(1000).optional(),
  consentTransactional: z.boolean().refine((v) => v, "Consent is required"),
});

const QuotePage = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [smsTransactional, setSmsTransactional] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { services: [], consentTransactional: false },
  });

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitting(true);
    try {
      const leadData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        service: data.services.join(", "),
        message: data.message || null,
        sms_transactional_consent: smsTransactional,
        sms_marketing_consent: smsMarketing,
      };

      const { error } = await supabase.from("leads").insert(leadData);
      if (error) throw error;

      supabase.functions.invoke("notify-new-lead", { body: { ...leadData, form_type: 'quote' } }).catch(() => {});

      if (smsTransactional && data.phone) {
        supabase.functions.invoke("send-sms-confirmation", {
          body: { phone: data.phone, firstName: data.firstName },
        }).catch(() => {});
      }

      toast({
        title: "Quote Request Sent!",
        description: "We'll get back to you as soon as possible.",
      });
      reset();
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const { seoTitle, seoDescription } = useSiteConfig("/quote");

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle || "Get a Free Quote"}
        description={seoDescription || "Request a free pest control quote from Dang Pest Control in Tyler, TX. Fast response, family & pet safe treatments, Super Powered Guarantee."}
        canonical="/quote"
      />
      <Navbar />
      <main>

      {/* Header */}
      <section style={{
        position: 'relative',
        background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
        paddingTop: '80px',
        paddingBottom: '200px',
        minHeight: '420px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(56px, 9vw, 100px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000000',
            textShadow: '3px 3px 0 #000000',
            margin: 0,
            lineHeight: 1,
          }}>
            GET YOUR QUOTE
          </h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* Form */}
      <section className="py-16" style={{background: 'hsl(30, 40%, 97%)'}}>
        <div className="container mx-auto px-4 max-w-2xl">
          <QuoteForm
            register={register}
            errors={errors}
            submitting={submitting}
            smsMarketing={smsMarketing}
            onSmsMarketingChange={setSmsMarketing}
            onSmsTransactionalChange={setSmsTransactional}
            onSubmit={handleSubmit(onSubmit)}
          />
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default QuotePage;
