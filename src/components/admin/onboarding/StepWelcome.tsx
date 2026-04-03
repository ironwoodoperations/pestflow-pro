interface Props { onNext: () => void }

export default function StepWelcome({ onNext }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
        <span className="text-3xl">🏠</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Welcome to PestFlow Pro!</h2>
      <p className="text-gray-500 max-w-md mx-auto text-base leading-relaxed">
        We'll set up your professional home services website in about 5 minutes.
        You can always change these settings later from your admin dashboard.
      </p>
      <button onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-10 py-4 rounded-lg transition text-lg">
        Get Started →
      </button>
    </div>
  )
}
