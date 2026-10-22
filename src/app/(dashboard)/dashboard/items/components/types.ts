import { z } from "zod";
import { itemSchema } from "@/lib/schemas";

export type Item = z.infer<typeof itemSchema>;
export type ItemForm = z.infer<typeof itemSchema>;
