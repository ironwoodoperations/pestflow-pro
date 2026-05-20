import { AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion'

export type AnalyticsSectionId = 'seo' | 'social' | 'blog'

interface AnalyticsSectionProps {
  id: AnalyticsSectionId
  title: string
  summaryStat?: string
  defaultExpanded?: boolean
  children: React.ReactNode
}

export default function AnalyticsSection({ id, title, summaryStat, children }: AnalyticsSectionProps) {
  return (
    <AccordionItem
      value={id}
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
        <div className="flex flex-1 items-center justify-between pr-3">
          <span className="text-base font-semibold text-gray-900">{title}</span>
          {summaryStat && (
            <span className="text-sm text-gray-500 font-medium tabular-nums">{summaryStat}</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/40">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}
