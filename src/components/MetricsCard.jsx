export default function MetricsCard({ title, value, subtitle, icon, accentColor, trend }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] group"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: `1px solid ${accentColor}15`,
        boxShadow: `0 0 20px ${accentColor}08`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}40, transparent 70%)` }}
      />
      <div
        className="absolute top-0 left-0 h-px w-12 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded" style={{ background: `${accentColor}15` }}>
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        {trend && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              trend.value >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
            }`}
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>

      <div
        className="uppercase tracking-wider mb-1 text-gray-500"
        style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}
      >
        {title}
      </div>
      <div
        className="text-white"
        style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "28px", fontWeight: 600, lineHeight: 1.1 }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
