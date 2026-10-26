import { z } from "zod";

/** What the API answers with when a request can't be carried out. */
export const ErrorMessage = z.object({ message: z.string() }).meta({ id: "ErrorMessage" });
export type ErrorMessage = z.infer<typeof ErrorMessage>;
