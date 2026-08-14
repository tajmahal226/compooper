import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type ConditionStatus =
  | "open"
  | "closed"
  | "queueing"
  | "out_of_paper"
  | "out_of_order";

export type ToiletStats = {
  avgRolls: number | null;
  ratingCount: number;
  condition: ConditionStatus | null;
  conditionAgeMin: number | null;
};

const REPORT_TTL_HOURS = 6;

export const getToiletStats = createServerFn({ method: "GET" })
  .validator((ids: string[]) => ids.filter(Boolean).slice(0, 100))
  .handler(async ({ data: ids }): Promise<Record<string, ToiletStats>> => {
    const out: Record<string, ToiletStats> = {};
    for (const id of ids) {
      out[id] = { avgRolls: null, ratingCount: 0, condition: null, conditionAgeMin: null };
    }
    if (ids.length === 0) return out;
    const sql = await getSql();
    const ratings = await sql.query<{ toilet_id: string; avg: number; n: number }>(
      `select toilet_id, avg(rolls)::float as avg, count(*)::int as n
       from toilet_ratings where toilet_id = any($1) group by toilet_id`,
      [ids],
    );
    for (const row of ratings) {
      out[row.toilet_id] = {
        ...out[row.toilet_id]!,
        avgRolls: Number(row.avg),
        ratingCount: Number(row.n),
      };
    }
    const reports = await sql.query<{
      toilet_id: string;
      status: ConditionStatus;
      created_at: string;
    }>(
      `select distinct on (toilet_id) toilet_id, status, created_at
       from toilet_reports
       where toilet_id = any($1)
         and created_at > now() - interval '${REPORT_TTL_HOURS} hours'
       order by toilet_id, created_at desc`,
      [ids],
    );
    for (const row of reports) {
      const age = Math.max(
        0,
        Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000),
      );
      out[row.toilet_id] = {
        ...out[row.toilet_id]!,
        condition: row.status,
        conditionAgeMin: age,
      };
    }
    return out;
  });

export const submitRating = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { toiletId: string; rolls: number; note?: string }) => input)
  .handler(async ({ context, data }) => {
    const rolls = Math.min(5, Math.max(1, Math.round(data.rolls)));
    const toiletId = data.toiletId.slice(0, 80);
    const note = (data.note ?? "").trim().slice(0, 280) || null;
    const sql = await getSql();
    await sql.query(
      `insert into toilet_ratings (id, user_id, toilet_id, rolls, note)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, toilet_id)
       do update set rolls = excluded.rolls, note = excluded.note, created_at = now()`,
      [crypto.randomUUID(), context.userId, toiletId, rolls, note],
    );
    return { ok: true as const };
  });

export const submitReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { toiletId: string; status: ConditionStatus }) => input)
  .handler(async ({ context, data }) => {
    const allowed: ConditionStatus[] = [
      "open",
      "closed",
      "queueing",
      "out_of_paper",
      "out_of_order",
    ];
    if (!allowed.includes(data.status)) throw new Error("Invalid status");
    const sql = await getSql();
    await sql.query(
      `insert into toilet_reports (id, user_id, toilet_id, status)
       values ($1, $2, $3, $4)`,
      [crypto.randomUUID(), context.userId, data.toiletId.slice(0, 80), data.status],
    );
    return { ok: true as const };
  });
