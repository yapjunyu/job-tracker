import { z } from "zod";

/** The signed-in user. */
export const User = z.object({ id: z.string(), email: z.email() }).meta({ id: "User" });
export type User = z.infer<typeof User>;
