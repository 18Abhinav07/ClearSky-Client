/**
 * Generating Loader Component
 *
 * Beautiful animated loader shown while backend:
 * 1. Aggregates sensor data
 * 2. Runs AI analysis
 * 3. Mints IP Asset on Story Protocol
 *
 * No polling - waits for response
 */

export function GeneratingLoader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-12">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-200/30 to-transparent animate-shimmer" />

      <div className="relative space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-100 to-blue-100 border-2 border-sky-300 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-sky-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 font-cairo mb-2">
            Generating Intelligence
          </h3>
          <p className="text-slate-600 text-sm">
            This process may take a few moments...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          <ProgressStep
            icon="📊"
            text="Aggregating sensor data from DePIN network"
            delay="0ms"
          />
          <ProgressStep
            icon="🤖"
            text="Running AI analysis on air quality trends"
            delay="300ms"
          />
          <ProgressStep
            icon="🔗"
            text="Minting IP Asset on Story Protocol"
            delay="600ms"
          />
          <ProgressStep
            icon="✨"
            text="Finalizing metadata and licenses"
            delay="900ms"
          />
        </div>

        {/* Animated Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 via-blue-400 to-sky-500 animate-progress-flow rounded-full" />
          </div>
        </div>

        {/* Helpful Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-600">
            Your report will be ready shortly and registered as a blockchain-verified IP Asset
          </p>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes progress-flow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-progress-flow {
          animation: progress-flow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function ProgressStep({
  icon,
  text,
  delay
}: {
  icon: string;
  text: string;
  delay: string;
}) {
  return (
    <div
      className="flex items-center gap-3 animate-pulse"
      style={{ animationDelay: delay }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center">
        <span className="text-sm">{icon}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" style={{ animationDelay: delay }} />
        <p className="text-sm text-slate-700">{text}</p>
      </div>
    </div>
  );
}
