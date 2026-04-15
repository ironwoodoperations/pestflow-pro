import { Send } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

export type QuoteFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  services: string[];
  message?: string;
  consentTransactional: boolean;
};

const serviceOptions = [
  "General Pest Control",
  "Mosquito Control",
  "Termite Control",
  "Flea & Tick Control",
  "Bed Bug Control",
  "Ant Control",
  "Spider Control",
  "Wasp Control",
  "Hornet Control",
  "Scorpion Control",
  "Rodent Control",
  "Roach Control",
  "Termite Inspections",
];

const labelStyle = { color: 'hsl(20, 40%, 12%)' };
const inputClass = "w-full rounded-xl border border-orange-200 px-4 py-2.5 text-base focus:outline-none focus:border-primary transition-colors";

interface QuoteFormProps {
  register: UseFormRegister<QuoteFormData>;
  errors: FieldErrors<QuoteFormData>;
  submitting: boolean;
  smsMarketing: boolean;
  onSmsMarketingChange: (checked: boolean) => void;
  onSmsTransactionalChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const QuoteForm = ({
  register,
  errors,
  submitting,
  smsMarketing,
  onSmsMarketingChange,
  onSmsTransactionalChange,
  onSubmit,
}: QuoteFormProps) => {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 space-y-6">
      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>First Name *</label>
          <input {...register("firstName")} className={inputClass} />
          {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>Last Name *</label>
          <input {...register("lastName")} className={inputClass} />
          {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>Email *</label>
          <input type="email" {...register("email")} className={inputClass} />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>Phone *</label>
          <input type="tel" {...register("phone")} className={inputClass} />
          {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-sm font-semibold mb-1 block" style={labelStyle}>Street Address *</label>
        <input {...register("address")} className={inputClass} />
        {errors.address && <p className="text-destructive text-xs mt-1">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>City *</label>
          <input {...register("city")} className={inputClass} />
          {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>State *</label>
          <input {...register("state")} className={inputClass} />
          {errors.state && <p className="text-destructive text-xs mt-1">{errors.state.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block" style={labelStyle}>ZIP *</label>
          <input {...register("zip")} className={inputClass} />
          {errors.zip && <p className="text-destructive text-xs mt-1">{errors.zip.message}</p>}
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="text-sm font-semibold mb-2 block" style={labelStyle}>Service(s) Requested *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {serviceOptions.map((service) => (
            <label key={service} className="flex items-center gap-2 text-sm" style={{color: 'hsl(20, 20%, 35%)'}}>
              <input type="checkbox" value={service} {...register("services")} className="rounded" />
              {service}
            </label>
          ))}
        </div>
        {errors.services && <p className="text-destructive text-xs mt-1">{errors.services.message}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="text-sm font-semibold mb-1 block" style={labelStyle}>Message (Optional)</label>
        <textarea {...register("message")} rows={4} className={inputClass} />
      </div>

      {/* Transactional SMS consent */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("consentTransactional", {
              onChange: (e) => onSmsTransactionalChange(e.target.checked),
            })}
            className="mt-1 w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">
            By checking this box, I consent to receive transactional messages related to Dang Pest Control for my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications among others. Message frequency may vary. Message &amp; Data rates may apply. Reply HELP for help or STOP to opt-out. *
          </span>
        </label>
        {errors.consentTransactional && <p className="text-destructive text-xs mt-1">{errors.consentTransactional.message}</p>}
      </div>

      {/* Marketing SMS consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={smsMarketing}
          onChange={e => onSmsMarketingChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">
          By checking this box, I consent to receive marketing and promotional messages from Dang Pest Control. Message frequency may vary. Message &amp; Data rates may apply. Reply HELP for help or STOP to opt-out.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="disabled:opacity-50 transition-all"
        style={{
          width: '100%',
          padding: '12px 32px',
          background: '#F97316',
          color: '#ffffff',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#ea6c0a')}
        onMouseOut={e => (e.currentTarget.style.background = '#F97316')}
      >
        <Send className="w-5 h-5 mr-2 inline" /> {submitting ? "Submitting..." : "Submit Quote Request"}
      </button>
    </form>
  );
};

export default QuoteForm;
