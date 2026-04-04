import { termsMeta, termsSections, planTable } from './terms-content';

function renderBody(body: string | string[]) {
  if (typeof body === 'string') {
    return body.split('\n').map((line, i) => (
      <p key={i} className="text-gray-700 leading-relaxed text-sm mt-1">{line}</p>
    ));
  }
  return (
    <ul className="mt-2 space-y-1">
      {body.map((line, i) => {
        if (line.startsWith('•')) {
          return (
            <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{line.slice(1).trim()}</span>
            </li>
          );
        }
        return (
          <li key={i} className="text-sm font-semibold text-gray-800 mt-3 list-none">{line}</li>
        );
      })}
    </ul>
  );
}

function PlanTable() {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-gray-200 divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Plan</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Monthly Fee</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Included Features</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {planTable.map((row) => (
            <tr key={row.plan} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200">{row.plan}</td>
              <td className="px-4 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">{row.fee}</td>
              <td className="px-4 py-2 text-gray-700">{row.features}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          PestFlow Pro | Ironwood Operations Group LLC
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{termsMeta.title}</h1>
        <p className="text-sm text-gray-500 italic mt-1 mb-8">{termsMeta.subtitle}</p>
        <hr className="border-gray-200 mb-8" />

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800 font-medium">
            PLEASE READ THESE TERMS CAREFULLY BEFORE ACCESSING THE PESTFLOW PRO PLATFORM.
            BY CHECKING THE ACCEPTANCE BOX DURING ONBOARDING, YOU AGREE TO BE LEGALLY BOUND BY THESE TERMS.
          </p>
        </div>

        {termsSections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{section.heading}</h2>
            {section.isTable && <PlanTable />}
            {renderBody(section.body)}
          </div>
        ))}

        <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
          Questions?{' '}
          <a href="mailto:scott@ironwoodoperationsgroup.com" className="text-emerald-700 underline">
            scott@ironwoodoperationsgroup.com
          </a>
        </div>
      </div>
    </div>
  );
}
