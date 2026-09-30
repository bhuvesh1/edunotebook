// app/admin/3d-studio/page.tsx — uploaded 3D model library + upload form.
// GLB/glTF preview on the detail page; OBJ/FBX are stored and served as-is.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { AdminForm, Field, inputCls } from "../ui";
import { uploadModel } from "./actions";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const STATUS_BADGE: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
};

function mb(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default async function Studio3DPage() {
  await requirePermission("models");

  const models = await prisma.model3D.findMany({
    orderBy: { createdAt: "desc" },
    include: { topic: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 font-hand text-2xl font-bold">3D Studio</h1>

      <div className="mb-8 max-w-2xl">
        <h2 className="mb-3 font-hand text-lg font-bold">Upload a model</h2>
        <AdminForm action={uploadModel} submitLabel="Upload model" cancelHref="/admin/3d-studio">
          <Field label="Display name" name="name" hint="Defaults to the file name if left blank.">
            <input name="name" id="name" className={inputCls} placeholder="Heart cross-section" maxLength={120} />
          </Field>
          <Field
            label="Model file"
            name="file"
            hint="Accepted: .glb, .gltf, .obj, .fbx, or a .zip containing a GLB/glTF (first .glb, else first .gltf, is used). Max 100 MB."
          >
            <input
              name="file"
              id="file"
              type="file"
              accept=".glb,.gltf,.obj,.fbx,.zip"
              className={`${inputCls} file:mr-3 file:rounded-md file:border-2 file:border-[var(--rule)] file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-bold`}
              required
            />
          </Field>
        </AdminForm>
      </div>

      <h2 className="mb-3 font-hand text-lg font-bold">
        Library{" "}
        <span className="text-sm font-normal text-slate-500">({models.length} models)</span>
      </h2>
      {models.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-[var(--rule)] px-4 py-6 text-sm text-slate-500">
          No models uploaded yet. Use the form above to add your first one.
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Size</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Mapped topic</th>
              <th className={thCls}>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td className={tdCls}>
                  <Link
                    href={`/admin/3d-studio/${m.id}`}
                    className="font-bold text-indigo-700 hover:underline"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className={`${tdCls} uppercase text-slate-600`}>{m.fileType || "—"}</td>
                <td className={`${tdCls} whitespace-nowrap`}>{mb(m.sizeBytes)}</td>
                <td className={tdCls}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[m.status] ?? "bg-slate-200 text-slate-700"}`}
                    title={m.note ?? undefined}
                  >
                    {m.status}
                  </span>
                </td>
                <td className={tdCls}>{m.topic ? m.topic.name : "—"}</td>
                <td className={`${tdCls} whitespace-nowrap text-slate-500`}>
                  {m.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
