import { privacyMeta, privacySections } from './privacy-content';

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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          PestFlow Pro | Ironwood Operations Group LLC
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{privacyMeta.title}</h1>
        <p className="text-sm text-gray-500 italic mt-1 mb-8">
          {privacyMeta.subtitle} &nbsp;·&nbsp; {privacyMeta.date}
        </p>
        <hr className="border-gray-200 mb-8" />

        {privacySections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{section.heading}</h2>
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
