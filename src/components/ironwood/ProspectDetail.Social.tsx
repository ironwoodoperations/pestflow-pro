import type { Prospect } from './types'

const SOCIALS: [keyof Prospect, string][] = [
  ['social_facebook','Facebook'],
  ['social_instagram','Instagram'],
  ['social_google','Google Business'],
  ['social_youtube','YouTube'],
  ['social_tiktok','TikTok'],
]
const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function SocialSection({ form, setField, onBlur }: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={form.has_existing_social || false}
          onChange={e => { setField('has_existing_social', e.target.checked); onBlur() }} />
        Has existing social profiles
      </label>
      <div className="grid grid-cols-2 gap-3">
        {SOCIALS.map(([key, label]) => (
          <div key={String(key)}>
            <label className="text-xs text-gray-400">{label}</label>
            <input className={inp} value={(form as any)[key] || ''}
              onChange={e => setField(String(key), e.target.value)} onBlur={onBlur} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 italic">Confirm and seed these before the reveal call.</p>
    </div>
  )
}
