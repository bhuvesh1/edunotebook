// Topic edit form (client): title, slug, description, status, 3D override.
"use client";

import { AdminForm, Field, inputCls } from "../ui";
import { updateTopic } from "./actions";
import { SIM_KEYS, SIM_META } from "@/lib/simulations/registry";

export interface TopicEditValues {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: string;
  simKey: string | null;
  placement: string; // "Subject / Category / Subcategory" breadcrumb
}

export function TopicEditForm({ initial }: { initial: TopicEditValues }) {
  return (
    <div>
      <h1 className="font-hand mb-2 text-3xl font-bold">Edit topic</h1>
      <p className="mb-6 text-sm text-slate-500">{initial.placement}</p>
      <AdminForm
        action={updateTopic.bind(null, initial.id)}
        submitLabel="Save changes"
        cancelHref="/admin/topics"
      >
        <Field label="Title" name="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name}
            className={inputCls}
          />
        </Field>
        <Field label="Slug" name="slug" hint="Unique within the subcategory.">
          <input
            id="slug"
            name="slug"
            defaultValue={initial.slug}
            className={`${inputCls} font-mono`}
          />
        </Field>
        <Field label="Description" name="description">
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={initial.description}
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" name="status">
            <select
              id="status"
              name="status"
              defaultValue={initial.status}
              className={inputCls}
            >
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </Field>
          <Field
            label="3D simulation override"
            name="simKey"
            hint="Auto = matched from the title via the sim registry."
          >
            <select
              id="simKey"
              name="simKey"
              defaultValue={initial.simKey ?? ""}
              className={inputCls}
            >
              <option value="">Auto</option>
              <option value="none">None — force no 3D</option>
              {SIM_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} — {SIM_META[k].title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </AdminForm>
    </div>
  );
}
