export interface FormData {
  businessName: string; phone: string; email: string; address: string
  hours: string; tagline: string; license: string; industry: string
  logoUrl: string; primaryColor: string; accentColor: string
  template: 'bold' | 'clean' | 'modern' | 'rustic'
  facebook: string; instagram: string; google: string; youtube: string
  locations: { city: string; slug: string }[]
}

export const INITIAL_FORM: FormData = {
  businessName: '', phone: '', email: '', address: '', hours: '',
  tagline: '', license: '', industry: 'Pest Control',
  logoUrl: '', primaryColor: '#10b981', accentColor: '#f5c518', template: 'bold',
  facebook: '', instagram: '', google: '', youtube: '',
  locations: [{ city: '', slug: '' }],
}

export const INPUT_CLASS = 'w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'
