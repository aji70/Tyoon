"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import AdminBarChart from "@/components/admin/AdminBarChart";
import { Loader2, RefreshCw } from "lucide-react";

type GamesOverDay = { date: string; started: number; finished: number };

type MinipayStatsData = {
  minipayGames: {
    total: number;
    byStatus: Record<string, number>;
    createdToday: number;
    finishedToday: number;
    createdThisWeek: number;
    createdThisMonth: number;
    distinctCreators: number;
    aiGames: number;
    humanGames: number;
  };
  gamesOverTime: GamesOverDay[];
  agents: {
    total: number;
    byStatus: Record<string, number>;
    createdToday: number;
    createdThisWeek: number;
    createdThisMonth: number;
    withErc8004: number;
    publicCount: number;
  };
  range: { start: string; end: string };
  excludes: string[];
  note?: string;
  generatedAt: string;
};

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#003B3E]/70 bg-[#0A1A1C]/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#7aa8ad]">{label}</p>
      <p className="mt-1 font-orbitron text-2xl font-semibold text-white tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#6a9096]">{hint}</p> : null}
    </div>
  );
}

function StatusList({ title, byStatus }: { title: string; byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-[#003B3E]/70 bg-[#0A1A1C]/80 p-4">
      <h2 className="mb-3 font-orbitron text-sm font-semibold text-[#C8F0F2]">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-[#6a9096]">No rows yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([status, count]) => (
            <li key={status} className="flex items-center justify-between text-sm">
              <span className="text-[#8ab4b8]">{status || "unknown"}</span>
              <span className="font-medium text-white tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MinipayStatsPublicPage() {
  const [data, setData] = useState<MinipayStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      // apiClient wraps axios body as `res.data`; backend body is `{ success, data: stats }`.
      const res = await apiClient.get<{ success?: boolean; data?: MinipayStatsData }>(
        "/analytics/minipay",
        params
      );
      const backend = res?.data as { success?: boolean; data?: MinipayStatsData } | undefined;
      const stats = backend?.data;
      if (!stats?.minipayGames || !stats?.agents) {
        throw new Error("Failed to load MiniPay stats");
      }
      setData(stats);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load MiniPay stats";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartSeries = useMemo(() => {
    if (!data?.gamesOverTime?.length) return [];
    return data.gamesOverTime.map((d) => ({
      label: d.date.slice(5),
      value: d.started,
      title: `${d.date}: ${d.started} created, ${d.finished} finished`,
    }));
  }, [data]);

  const maxDayTotal = useMemo(() => {
    if (!data?.gamesOverTime?.length) return 1;
    return Math.max(1, ...data.gamesOverTime.map((x) => x.started + x.finished));
  }, [data]);

  return (
    <div className="min-h-screen bg-[#061012] text-[#E8F6F7]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-orbitron text-[11px] uppercase tracking-[0.2em] text-[#00F0FF]/80">
              Tycoon · Public
            </p>
            <h1 className="mt-1 font-orbitron text-2xl font-bold text-white">MiniPay Stats</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9bc4c8]">
              Live MiniPay-tagged games and agent registry counts. Balances and treasury are not shown.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-[#003B3E] px-3 py-2 text-sm text-[#9bc4c8] hover:bg-[#0A1A1C]"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-3 py-2 text-sm text-[#00F0FF] hover:bg-[#00F0FF]/15 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#003B3E]/70 bg-[#0A1A1C]/60 p-3">
          <label className="text-xs text-[#7aa8ad]">
            From
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-md border border-[#003B3E] bg-[#061012] px-2 py-1.5 text-sm text-white"
            />
          </label>
          <label className="text-xs text-[#7aa8ad]">
            To
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-md border border-[#003B3E] bg-[#061012] px-2 py-1.5 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-md border border-[#003B3E] px-3 py-1.5 text-xs text-[#9bc4c8] hover:bg-[#0A1A1C]"
          >
            Clear range
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="flex items-center gap-2 py-16 text-[#9bc4c8]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading MiniPay stats…
          </div>
        ) : null}

        {data ? (
          <>
            {data.note ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/80">
                {data.note}
              </p>
            ) : null}

            <section>
              <h2 className="mb-3 font-orbitron text-sm font-semibold uppercase tracking-wide text-[#00F0FF]/90">
                MiniPay games
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total MiniPay games" value={data.minipayGames.total} />
                <StatCard label="Distinct creators" value={data.minipayGames.distinctCreators} />
                <StatCard label="Created today" value={data.minipayGames.createdToday} />
                <StatCard label="Finished today" value={data.minipayGames.finishedToday} />
                <StatCard label="Created this week" value={data.minipayGames.createdThisWeek} />
                <StatCard label="Created this month" value={data.minipayGames.createdThisMonth} />
                <StatCard label="AI games" value={data.minipayGames.aiGames} />
                <StatCard label="Human / other" value={data.minipayGames.humanGames} />
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <StatusList title="MiniPay games by status" byStatus={data.minipayGames.byStatus} />
              <StatusList title="Agents by status" byStatus={data.agents.byStatus} />
            </div>

            <section>
              <h2 className="mb-3 font-orbitron text-sm font-semibold uppercase tracking-wide text-emerald-300/90">
                Agents
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total agents" value={data.agents.total} />
                <StatCard label="Created today" value={data.agents.createdToday} />
                <StatCard label="Created this week" value={data.agents.createdThisWeek} />
                <StatCard label="Created this month" value={data.agents.createdThisMonth} />
                <StatCard label="With ERC-8004 id" value={data.agents.withErc8004} />
                <StatCard label="Public agents" value={data.agents.publicCount} />
              </div>
            </section>

            <section className="rounded-xl border border-[#003B3E]/70 bg-[#0A1A1C]/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-orbitron text-sm font-semibold text-[#C8F0F2]">
                  MiniPay games created by day
                </h2>
                <p className="text-xs text-[#6a9096]">
                  {data.range.start} → {data.range.end} (UTC)
                </p>
              </div>
              {chartSeries.length === 0 ? (
                <p className="text-xs text-[#6a9096]">No MiniPay games in this range.</p>
              ) : (
                <>
                  <AdminBarChart
                    series={chartSeries}
                    valueLabel="games created"
                    barClassName="bg-cyan-500/80"
                  />
                  <div className="mt-4 max-h-56 overflow-hidden overflow-y-auto rounded-xl border border-[#003B3E]/60 bg-[#061012]/50">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0A1A1C] text-left text-[#7aa8ad]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 text-right font-medium">Created</th>
                          <th className="px-3 py-2 text-right font-medium">Finished</th>
                          <th className="px-3 py-2 font-medium">Mix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gamesOverTime.map((row) => {
                          const t = row.started + row.finished;
                          return (
                            <tr key={row.date} className="border-t border-[#003B3E]/50">
                              <td className="px-3 py-1.5 text-[#C8E0E2]">{row.date}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-white">
                                {row.started}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-white">
                                {row.finished}
                              </td>
                              <td className="px-3 py-1.5">
                                <div
                                  className="flex h-2 overflow-hidden rounded bg-[#061012]"
                                  title={`${row.started} created, ${row.finished} finished`}
                                >
                                  {t > 0 ? (
                                    <>
                                      <div
                                        className="bg-cyan-500/80"
                                        style={{ width: `${(row.started / maxDayTotal) * 100}%` }}
                                      />
                                      <div
                                        className="bg-emerald-500/70"
                                        style={{ width: `${(row.finished / maxDayTotal) * 100}%` }}
                                      />
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <p className="text-xs text-[#56787c]">
              Generated {new Date(data.generatedAt).toLocaleString()} · Excludes:{" "}
              {(data.excludes || []).join(", ")}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
