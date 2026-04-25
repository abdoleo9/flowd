"use client";

import { formatDA } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { DeliveryPanel } from "./DeliveryPanel";
import { ChatbotFeed } from "./ChatbotFeed";
import type { Order, DeliveryParcel, Conversation } from "@/types/database";

// ─── Static chart data ────────────────────────────────────────────────────────
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const BAR_DATA = [42,58,51,76,89,94,112,98,124,108,136,148];
const LINE_DATA = [28,35,30,48,52,61,74,68,81,77,89,94];

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, change, positive, accent, icon,
}: {
  label: string; value: string; change: string;
  positive: boolean; accent: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 14,
      padding: "18px",
      boxShadow: "0 2px 10px var(--shadow)",
      flex: 1,
      minWidth: 0,
      border: "1px solid var(--border-sub)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          background: positive ? "#F0FDF4" : "#FFF1F2",
          color: positive ? "#16A34A" : "#E11D48",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          {positive ? "↑" : "↓"} {change}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart() {
  const max = Math.max(...BAR_DATA);
  const W = 520, H = 150, padL = 40, padB = 22, padT = 8, padR = 6;
  const bw = (W - padL - padR) / MONTHS.length;
  const barW = bw * 0.54;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + (1 - t) * (H - padT - padB);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--chart-line)" strokeWidth="1" />
            <text x={padL - 5} y={y + 4} textAnchor="end" fontSize="8.5" fill="var(--text-5)">
              {t === 0 ? "0" : `${Math.round(max * t)}k`}
            </text>
          </g>
        );
      })}
      {BAR_DATA.map((v, i) => {
        const x = padL + i * bw + (bw - barW) / 2;
        const bh = (v / max) * (H - padT - padB);
        const y = H - padB - bh;
        const recent = i >= BAR_DATA.length - 3;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="4" fill={recent ? "#0052FF" : "var(--primary-sub)"} />
            <text x={padL + i * bw + bw / 2} y={H - padB + 14} textAnchor="middle" fontSize="8.5" fill="var(--text-5)">
              {MONTHS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── LineChart ────────────────────────────────────────────────────────────────
function LineChart() {
  const max = Math.max(...LINE_DATA);
  const W = 270, H = 110, padL = 24, padB = 18, padT = 8, padR = 6;
  const pts = LINE_DATA.map((v, i) => [
    padL + (i / (LINE_DATA.length - 1)) * (W - padL - padR),
    padT + (1 - v / max) * (H - padT - padB),
  ]);
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaD = pathD + ` L ${pts[pts.length - 1][0]} ${H - padB} L ${pts[0][0]} ${H - padB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0052FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => (
        <line key={i} x1={padL} y1={padT + (1 - t) * (H - padT - padB)} x2={W - padR} y2={padT + (1 - t) * (H - padT - padB)} stroke="var(--chart-line)" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#lg1)" />
      <path d={pathD} fill="none" stroke="#0052FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) =>
        i % 3 === 0 ? <circle key={i} cx={x} cy={y} r="3" fill="#0052FF" stroke="var(--bg-card)" strokeWidth="1.5" /> : null
      )}
      {LINE_DATA.map((_, i) => (
        <text key={i} x={padL + (i / (LINE_DATA.length - 1)) * (W - padL - padR)} y={H - padB + 12} textAnchor="middle" fontSize="7.5" fill="var(--text-5)">
          {i % 2 === 0 ? MONTHS[i] : ""}
        </text>
      ))}
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  totalOrders: number;
  totalRevenue: number;
  deliveryRate: number;
  returnRate: number;
  recentOrders: Order[];
  parcels: DeliveryParcel[];
  conversations: Conversation[];
}

// ─── DashboardShell ───────────────────────────────────────────────────────────
export function DashboardShell({
  totalOrders, totalRevenue, deliveryRate, returnRate,
  recentOrders, parcels, conversations,
}: Props) {
  const { t } = useLanguage();
  return (
    <div className="fade-in" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>{t.dashboard.title}</h1>
        <p style={{ fontSize: 12, color: "var(--text-4)", margin: "3px 0 0" }}>{t.dashboard.subtitle}</p>
      </div>

      {/* Metric cards */}
      <div className="metric-grid" style={{ marginBottom: 16 }}>
        <MetricCard
          label={t.dashboard.totalOrders}
          value={String(totalOrders)}
          change="12%"
          positive
          accent="#F59E0B"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="13" rx="2" stroke="#F59E0B" strokeWidth="1.7" />
              <path d="M7 4V3a3 3 0 0 1 6 0v1" stroke="#F59E0B" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label={t.dashboard.revenue}
          value={formatDA(totalRevenue)}
          change="8.3%"
          positive
          accent="#0052FF"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#0052FF" strokeWidth="1.7" />
              <path d="M10 6v1m0 6v1m-2.5-5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1.8 2-2.5 2-2.5.9-2.5 2 .9 2 2.5 2 2.5-.9 2.5-2" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label={t.dashboard.deliveryRate}
          value={`${deliveryRate}%`}
          change="5.1%"
          positive
          accent="#10B981"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="5" width="12" height="10" rx="1.5" stroke="#10B981" strokeWidth="1.7" />
              <path d="M13 8h3l3 3.5V15h-6V8z" stroke="#10B981" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="5" cy="16.5" r="1.5" stroke="#10B981" strokeWidth="1.4" />
              <circle cx="15" cy="16.5" r="1.5" stroke="#10B981" strokeWidth="1.4" />
            </svg>
          }
        />
        <MetricCard
          label={t.dashboard.returnRate}
          value={`${returnRate}%`}
          change="2.3%"
          positive={false}
          accent="#EF4444"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 8V5l4-3 4 3v3" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1" y="8" width="16" height="10" rx="1.5" stroke="#EF4444" strokeWidth="1.7" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="chart-row" style={{ marginBottom: 16 }}>
        {/* Bar chart — revenue */}
        <div style={{ flex: 2, background: "var(--bg-card)", borderRadius: 14, padding: "16px 16px 10px", boxShadow: "0 2px 10px var(--shadow)", border: "1px solid var(--border-sub)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{t.dashboard.revenue}</p>
              <p style={{ fontSize: 11, color: "var(--text-4)", margin: "1px 0 0" }}>12 derniers mois</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "3px 8px", borderRadius: 20 }}>↑ 8.3%</span>
          </div>
          <BarChart />
        </div>

        {/* Line chart — delivery rate */}
        <div style={{ flex: 1, background: "var(--bg-card)", borderRadius: 14, padding: "16px 16px 10px", boxShadow: "0 2px 10px var(--shadow)", border: "1px solid var(--border-sub)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{t.dashboard.deliveryRate}</p>
              <p style={{ fontSize: 11, color: "var(--text-4)", margin: "1px 0 0" }}>Taux mensuel</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "3px 8px", borderRadius: 20 }}>↑ 5%</span>
          </div>
          <LineChart />
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ marginBottom: 16 }}>
        <RecentOrdersTable orders={recentOrders} />
      </div>

      {/* Bottom panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }} className="lg:grid-cols-2">
        <DeliveryPanel parcels={parcels} />
        <ChatbotFeed conversations={conversations} />
      </div>
    </div>
  );
}
