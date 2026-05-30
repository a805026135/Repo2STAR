import { useResume } from '../store/ResumeContext';
import { templates } from '../data/templates';
import { Check } from 'lucide-react';

export default function TemplateSelector() {
  const { activeTemplate, setTemplate } = useResume();

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => setTemplate(t.id)}
          className={`relative group rounded-xl border-2 p-4 transition-all text-left ${
            activeTemplate === t.id
              ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30'
              : 'border-gray-800 hover:border-gray-700 hover:shadow-sm'
          }`}
        >
          {activeTemplate === t.id && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
          {/* Template preview stripe */}
          <div
            className="h-20 rounded-lg mb-3 flex items-end justify-start p-3 relative overflow-hidden"
            style={{ background: t.previewColor }}
          >
            <div className="absolute inset-0 opacity-20" style={{
              background: t.id === 'fresh'
                ? 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)'
                : t.id === 'executive'
                  ? 'linear-gradient(135deg, #0f172a, #1e293b)'
                  : undefined
            }} />
            {/* Mini layout preview lines */}
            <div className="flex flex-col gap-1 w-full relative z-10">
              {t.id === 'modern' ? (
                <div className="flex gap-2">
                  <div className="w-1/3 space-y-1">
                    <div className="h-1.5 bg-white/40 rounded w-3/4" />
                    <div className="h-1 bg-white/25 rounded w-full" />
                    <div className="h-1 bg-white/25 rounded w-4/5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 bg-white/40 rounded w-1/2" />
                    <div className="h-1 bg-white/25 rounded w-full" />
                    <div className="h-1 bg-white/25 rounded w-full" />
                    <div className="h-1 bg-white/25 rounded w-3/4" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="h-2 bg-white/50 rounded w-1/2 mx-auto" />
                  <div className="h-1 bg-white/25 rounded w-2/3 mx-auto" />
                  <div className="h-px bg-white/20 my-1" />
                  <div className="h-1 bg-white/30 rounded w-1/3" />
                  <div className="h-1 bg-white/20 rounded w-full" />
                  <div className="h-1 bg-white/20 rounded w-4/5" />
                  <div className="h-1 bg-white/20 rounded w-full" />
                </div>
              )}
            </div>
          </div>
          <h4 className="font-semibold text-sm text-white mb-1">{t.name}</h4>
          <p className="text-xs text-gray-400 leading-tight">{t.description}</p>
        </button>
      ))}
    </div>
  );
}
