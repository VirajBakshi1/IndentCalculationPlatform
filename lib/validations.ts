import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Config ───────────────────────────────────────────────────────────────────

export const ConfigUpdateSchema = z.object({
  value: z.string().min(1, "Value is required"),
});

export const ConfigBatchUpdateSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});

// ─── Admin Email ──────────────────────────────────────────────────────────────

export const AdminEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─── MTO Processing ───────────────────────────────────────────────────────────

export const ProjectDetailsSchema = z.object({
  projectNumber: z.string().max(50).default(""),
  date: z.string().max(20).default(""),
  phaseNumber: z.string().max(20).default(""),
  sapNumber: z.string().max(50).default(""),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ConfigUpdateInput = z.infer<typeof ConfigUpdateSchema>;
export type AdminEmailInput = z.infer<typeof AdminEmailSchema>;
export type ProjectDetailsInput = z.infer<typeof ProjectDetailsSchema>;
