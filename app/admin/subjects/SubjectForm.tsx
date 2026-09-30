// Subject create/edit form (client — error display via useFormState).
"use client";

import { AdminForm, Field, inputCls, checkCls } from "../ui";
import { createSubject, updateSubject } from "./actions";

export interface SubjectValues {
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export function SubjectForm({
  initial,
  heading,
}: {
  initial: SubjectValues;
  heading: string;
}) {
  const action = initial.id
    ? updateSubject.bind(null, initial.id)
    : createSubject;
  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">{heading}</h1>
      <AdminForm
        action={action}
        submitLabel={initial.id ? "Save changes" : "Create subject"}
        cancelHref="/admin/subjects"
      >
        <Field label="Name" name="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name}
            placeholder="e.g. Physics"
            className={inputCls}
          />
        </Field>
        <Field label="Slug" name="slug" hint="Auto-filled from the name if left blank. Must be unique.">
          <input
            id="slug"
            name="slug"
            defaultValue={initial.slug}
            placeholder="e.g. physics"
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
        <div className="grid grid-cols-3 gap-4">
          <Field label="Icon (emoji)" name="icon">
            <input
              id="icon"
              name="icon"
              defaultValue={initial.icon}
              placeholder="📚"
              maxLength={8}
              className={inputCls}
            />
          </Field>
          <Field label="Order" name="order" hint="Lower shows first.">
            <input
              id="order"
              name="order"
              type="number"
              defaultValue={initial.order}
              className={inputCls}
            />
          </Field>
          <div className="pt-7">
            <label className="text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={initial.enabled}
                className={checkCls}
              />
              Enabled
            </label>
          </div>
        </div>
      </AdminForm>
    </div>
  );
}
