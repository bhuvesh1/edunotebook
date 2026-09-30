// app/admin/3d-studio/[id]/page.tsx — model detail: preview, mapping,
// rename, replace file, delete.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { ConfirmAction, AdminForm, Field, inputCls } from "../../ui";
import { UploadedModelViewer } from "@/app/components/sims/UploadedModelViewer";
import { SimErrorBoundary } from "@/app/components/sims/SimErrorBoundary";
import { mapModel, unmapModel, renameModel, replaceModelFile, deleteModel } from "../actions";

const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";
const labelCls = "w-36 shrink-0 font-bold text-slate-600";

function mb(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function Hidden({ id }: { id: number }) {
  return <input type="hidden" name="id" value={id} />;
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("models");
  const { id } = await params;
  const model = await prisma.model3D.findUnique({
    where: { id: Number(id) },
    include: { topic: { select: { id: true, name: true } } },
  });
  if (!model) notFound();

  const previewable = model.status === "ready" && ["glb", "gltf"].includes(model.fileType);

  return (
    <div>
      <Link href="/admin/3d-studio" className="text-sm font-bold text-indigo-700 hover:underline">
        ← Back to 3D Studio
      </Link>
      <h1 className="mt-2 font-hand text-2xl font-bold">{model.name}</h1>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          {previewable ? (
            <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-[var(--rule)] bg-[#0b1020]">
              <SimErrorBoundary>
                <UploadedModelViewer url={model.filePath} />
              </SimErrorBoundary>
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[var(--rule)] bg-slate-50 p-6 text-center">
              {model.status === "failed" ? (
                <p className="text-sm font-semibold text-red-700">
                  Processing failed{model.note ? `: ${model.note}` : "."} Upload a
                  valid file below to replace it.
                </p>
              ) : model.status === "processing" ? (
                <p className="text-sm text-slate-600">Still processing…</p>
              ) : (
                <p className="max-w-xs text-sm text-slate-600">
                  Preview supports GLB/glTF — OBJ/FBX is stored and served as-is,
                  without an in-browser preview.
                </p>
              )}
            </div>
          )}

          <table className="mt-4 w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${tdCls} ${labelCls}`}>File type</td>
                <td className={`${tdCls} uppercase`}>{model.fileType || "—"}</td>
              </tr>
              <tr>
                <td className={`${tdCls} ${labelCls}`}>Size</td>
                <td className={tdCls}>{mb(model.sizeBytes)}</td>
              </tr>
              <tr>
                <td className={`${tdCls} ${labelCls}`}>Status</td>
                <td className={tdCls}>{model.status}</td>
              </tr>
              <tr>
                <td className={`${tdCls} ${labelCls}`}>URL</td>
                <td className={`${tdCls} break-all font-mono text-xs`}>{model.filePath || "—"}</td>
              </tr>
              <tr>
                <td className={`${tdCls} ${labelCls}`}>Mapped topic</td>
                <td className={tdCls}>
                  {model.topic ? (
                    <>
                      {model.topic.name}{" "}
                      <span className="text-slate-500">(#{model.topic.id})</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border-2 border-[var(--rule)] bg-white/80 p-5">
            <h2 className="mb-3 font-hand text-lg font-bold">Map to topic</h2>
            <p className="mb-3 text-xs text-slate-500">
              One model per topic — if the topic already has a model, unmap that
              one first.
            </p>
            <QuickMapForm id={model.id} />
            {model.topic && (
              <div className="mt-3">
                <ConfirmAction
                  action={unmapModel}
                  label="Unmap from topic"
                  confirmMessage="Remove this model from its topic? The model stays in the library."
                  danger={false}
                  extra={<Hidden id={model.id} />}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border-2 border-[var(--rule)] bg-white/80 p-5">
            <h2 className="mb-3 font-hand text-lg font-bold">Rename</h2>
            <RenameForm id={model.id} name={model.name} />
          </div>

          <div className="rounded-xl border-2 border-[var(--rule)] bg-white/80 p-5">
            <h2 className="mb-3 font-hand text-lg font-bold">Replace file</h2>
            <p className="mb-3 text-xs text-slate-500">
              Uploads a new file into the same model record — the URL and topic
              mapping stay the same.
            </p>
            <ReplaceForm id={model.id} />
          </div>

          <div className="rounded-xl border-2 border-red-200 bg-red-50/60 p-5">
            <h2 className="mb-3 font-hand text-lg font-bold text-red-800">Delete</h2>
            <ConfirmAction
              action={deleteModel}
              label="Delete model"
              confirmMessage="Permanently delete this model and its files?"
              extra={<Hidden id={model.id} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-wrapped forms so the buttons show action errors via useFormState.
function QuickMapForm({ id }: { id: number }) {
  return (
    <MapFormInner action={mapModel} submitLabel="Map" id={id}>
      <Field label="Topic ID" name="topicId" hint="The numeric topic id to show this model on.">
        <input name="topicId" id={`topicId-${id}`} className={inputCls} inputMode="numeric" required />
      </Field>
    </MapFormInner>
  );
}

function RenameForm({ id, name }: { id: number; name: string }) {
  return (
    <MapFormInner action={renameModel} submitLabel="Rename" id={id}>
      <Field label="Name" name="name">
        <input name="name" id={`name-${id}`} className={inputCls} defaultValue={name} maxLength={120} required />
      </Field>
    </MapFormInner>
  );
}

function ReplaceForm({ id }: { id: number }) {
  return (
    <MapFormInner action={replaceModelFile} submitLabel="Replace file" id={id}>
      <Field label="New file" name="file">
        <input
          name="file"
          id={`file-${id}`}
          type="file"
          accept=".glb,.gltf,.obj,.fbx,.zip"
          className={inputCls}
          required
        />
      </Field>
    </MapFormInner>
  );
}

import type { ActionState } from "../../ui";

/** Thin wrapper around AdminForm that injects the hidden model id. */
function MapFormInner({
  action,
  submitLabel,
  children,
  id,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  id: number;
  children: ReactNode;
}) {
  return (
    <AdminForm action={action} submitLabel={submitLabel} cancelHref={`/admin/3d-studio/${id}`}>
      <input type="hidden" name="id" value={id} />
      {children}
    </AdminForm>
  );
}
