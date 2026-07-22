import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

/* Palette imposée : orange + encre + déclinaisons. */
export const CHART_COLORS = ["#f97316", "#0d0d0d", "#c2410c", "#fdba74", "#525252", "#fed7aa"];

export function DonutChart({ data, height = 260 }) {
  const empty = !data || data.every((d) => !d.value);
  if (empty) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, dataKey, xKey = "jour", name, color = "#f97316", height = 260 }) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d0d0d12" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barres empilées (ex. réception : effectuées / en attente / annulées). */
export function StackedBars({ data, series, xKey = "jour", height = 260 }) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d0d0d12" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a"
            fill={CHART_COLORS[i % CHART_COLORS.length]} radius={i === series.length - 1 ? [6, 6, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * AJOUT — Courbe évolutive en aire remplie avec dégradé orange
 * (façon dashboard analytique moderne). Idéale pour montrer une
 * tendance dans le temps. Chaque instance a son propre id de dégradé
 * pour éviter les conflits SVG quand plusieurs courbes coexistent.
 */
export function AreaTrend({ data, dataKey, xKey = "mois", name, color = "#f97316", height = 280 }) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  const gradId = `grad-${dataKey}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d0d0d12" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ height }) {
  return (
    <div className="flex items-center justify-center text-sm text-ink/40" style={{ height }}>
      Pas encore de données à afficher.
    </div>
  );
}

/** Carte titrée qui enveloppe un graphique. */
export function ChartCard({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}