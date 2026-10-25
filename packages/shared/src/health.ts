import { z } from "zod";

export const Health = z.object({ ok: z.literal(true) }).meta({ id: "Health" });
export type Health = z.infer<typeof Health>;
