import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

// Kaki (#8b733f) ajouté en fin de palette générale — sert de teinte de repli
// pour les graphiques positionnels ET pour désambiguïser les cas où deux
// oranges de CHART_COLORS se retrouveraient trop proches l'un de l'autre
// (ex. modes de paiement, voir resolvePaymentModeColor ci-dessous).
export const CHART_COLORS = ["#f97316", "var(--color-ink)", "#c2410c", "#fdba74", "#525252", "#fed7aa", "#8b733f"];

const GRID_STROKE = "color-mix(in srgb, var(--color-ink) 7%, transparent)";

function normalizeKey(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Mapping couleur par statut, utilisé uniquement par StackedBars (réservations).
const STATUS_COLOR_RULES = [
  { test: (v) => v.startsWith("annul"), color: "var(--color-ink)" },   // Annulée(s) -> noir
  { test: (v) => v.startsWith("effectu"), color: "#c2410c" },          // Effectuée(s) -> orange foncé
  { test: (v) => v.includes("attente"), color: "#f97316" },            // En attente -> orange clair (accent)
];

function resolveStatusColor(key, name, fallbackIndex) {
  const k = normalizeKey(key);
  const n = normalizeKey(name);
  const rule = STATUS_COLOR_RULES.find((r) => r.test(k) || r.test(n));
  return rule ? rule.color : CHART_COLORS[fallbackIndex % CHART_COLORS.length];
}

// Modes de paiement (donut "Paiements par mode", caisse) : à 3 modes, la
// palette positionnelle place deux oranges proches (index 0 et 2) — source
// de confusion réelle repérée en session. Le kaki désambiguïse Moov Money.
const PAYMENT_MODE_COLOR_RULES = [
  { test: (v) => v.includes("espece"), color: "#f97316" },      // Espèces -> orange accent
  { test: (v) => v.includes("moov"), color: "#8b733f" },        // Moov Money -> kaki
  { test: (v) => v.includes("airtel"), color: "var(--color-ink)" }, // Airtel Money -> encre
];

function resolvePaymentModeColor(name, fallbackIndex) {
  const n = normalizeKey(name);
  const rule = PAYMENT_MODE_COLOR_RULES.find((r) => r.test(n));
  return rule ? rule.color : CHART_COLORS[fallbackIndex % CHART_COLORS.length];
}

function isPaymentModeData(data) {
  if (!data || data.length === 0) return false;
  return data.every((d) => PAYMENT_MODE_COLOR_RULES.some((r) => r.test(normalizeKey(d.name))));
}

export function DonutChart({ data, height = 260 }) {
  const empty = !data || data.every((d) => !d.value);
  if (empty) return <ChartEmpty height={height} />;
  const paymentMode = isPaymentModeData(data);
  const colorFor = (d, i) => (paymentMode ? resolvePaymentModeColor(d.name, i) : CHART_COLORS[i % CHART_COLORS.length]);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={colorFor(d, i)} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data, dataKey, xKey = "jour", name, color = "#f97316", height = 260,
  maxBarSize = 28, barCategoryGap = "60%",
}) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap={barCategoryGap} maxBarSize={maxBarSize}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[6, 6, 0, 0]} maxBarSize={maxBarSize} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedBars({ data, series, xKey = "jour", height = 260 }) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a"
            fill={resolveStatusColor(s.key, s.name, i)}
            radius={i === series.length - 1 ? [6, 6, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaTrend({ data, dataKey, xKey = "mois", name, color = "#f97316", height = 280, fillOpacity = 0.35 }) {
  const empty = !data || data.length === 0;
  if (empty) return <ChartEmpty height={height} />;
  const gradId = `grad-${dataKey}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
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

export function ChartCard({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}