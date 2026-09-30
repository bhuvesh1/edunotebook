// New topic form (client): chained subject → category → subcategory selects.
"use client";

import { useState } from "react";
import { AdminForm, Field, inputCls } from "../ui";
import { createTopic } from "./actions";
import { SIM_KEYS, SIM_META } from "@/lib/simulations/registry";

export interface TaxonomyTree {
  id: number;
  name: string;
  categories: {
    id: number;
    name: string;
    subcategories: { id: number; name: string }[];
  }[];
}

export function TopicNewForm({ tree }: { tree: TaxonomyTree[] }) {
  const [subjectId, setSubjectId] = useState<number | null>(
    tree[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const subject = tree.find((s) => s.id === subjectId) ?? tree[0];
  const category =
    subject?.categories.find((c) => c.id === categoryId) ??
    subject?.categories[0];

  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">New topic</h1>
      <AdminForm
        action={createTopic}
        submitLabel="Create topic"
        cancelHref="/admin/topics"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Subject" name="subjectPick">
            <select
              id="subjectPick"
              value={subject?.id ?? ""}
              onChange={(e) => {
                setSubjectId(Number(e.target.value));
                setCategoryId(null);
              }}
              className={inputCls}
            >
              {tree.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" name="categoryPick">
            <select
              id="categoryPick"
              value={category?.id ?? ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className={inputCls}
            >
              {subject?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory" name="subcategoryId">
            <select id="subcategoryId" name="subcategoryId" required className={inputCls}>
              {category?.subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Title" name="name">
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Projectile Motion"
            className={inputCls}
          />
        </Field>
        <Field label="Slug" name="slug" hint="Auto-filled from the title if left blank.">
          <input id="slug" name="slug" className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Description" name="description">
          <textarea id="description" name="description" rows={2} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" name="status">
            <select id="status" name="status" defaultValue="published" className={inputCls}>
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </Field>
          <Field label="3D simulation" name="simKey" hint="Auto = matched from the title.">
            <select id="simKey" name="simKey" defaultValue="" className={inputCls}>
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
