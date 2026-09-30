// Category create/edit form (client).
"use client";

import { AdminForm, Field, inputCls } from "../ui";
import { createCategory, updateCategory } from "./actions";

export interface CategoryValues {
  id?: number;
  name: string;
  slug: string;
  description: string;
  order: number;
  subjectId: number | null;
}

export function CategoryForm({
  initial,
  heading,
  subjects,
}: {
  initial: CategoryValues;
  heading: string;
  subjects: { id: number; name: string }[];
}) {
  const action = initial.id
    ? updateCategory.bind(null, initial.id)
    : createCategory;
  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">{heading}</h1>
      <AdminForm
        action={action}
        submitLabel={initial.id ? "Save changes" : "Create category"}
        cancelHref="/admin/categories"
      >
        <Field label="Subject" name="subjectId">
          <select
            id="subjectId"
            name="subjectId"
            required
            defaultValue={initial.subjectId ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              — pick a subject —
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name" name="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name}
            placeholder="e.g. Mechanics"
            className={inputCls}
          />
        </Field>
        <Field label="Slug" name="slug" hint="Auto-filled from the name if left blank. Unique within the subject.">
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
        <Field label="Order" name="order" hint="Lower shows first within the subject.">
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={initial.order}
            className={inputCls}
          />
        </Field>
      </AdminForm>
    </div>
  );
}
