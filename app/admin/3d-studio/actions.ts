// app/admin/3d-studio/actions.ts — uploaded 3D model library management.
// Files live under public/uploads/models/<id>/ and are served statically.
// One model maps to at most one topic (Model3D.topicId is @unique).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../ui";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const DIRECT_EXTS = ["glb", "gltf", "obj", "fbx"] as const;
const ZIP_EXTS = [...DIRECT_EXTS, "zip"] as const;

function extOf(filename: string): string {
  return path.extname(filename).toLowerCase().replace(/^\./, "");
}

function modelDir(id: number): string {
  // id comes from the DB (an integer), so this path is safe from traversal.
  return path.join(process.cwd(), "public", "uploads", "models", String(id));
}

async function findFirstModelFile(dir: string): Promise<{ file: string; ext: string } | null> {
  // Prefer .glb, then .gltf; .obj/.fbx inside zips are not auto-picked.
  const found: { file: string; ext: string }[] = [];
  async function walk(d: string): Promise<void> {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else {
        const ext = extOf(e.name);
        if (ext === "glb" || ext === "gltf") found.push({ file: full, ext });
      }
    }
  }
  await walk(dir);
  found.sort((a, b) =>
    a.ext === b.ext ? a.file.localeCompare(b.file) : a.ext === "glb" ? -1 : 1
  );
  return found[0] ?? null;
}

/** Write the uploaded file into the model's dir as model.<ext>; returns fileType + sizeBytes. */
async function ingestUpload(
  id: number,
  file: File
): Promise<{ fileType: string; sizeBytes: number; publicPath: string } | { failed: string }> {
  const dir = modelDir(id);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  const ext = extOf(file.name);
  const buf = Buffer.from(await file.arrayBuffer());

  if (ext === "zip") {
    const zip = new AdmZip(buf);
    zip.extractAllTo(dir, true);
    const picked = await findFirstModelFile(dir);
    if (!picked) {
      return { failed: "no GLB/glTF inside ZIP" };
    }
    const target = path.join(dir, `model.${picked.ext}`);
    await fs.rename(picked.file, target);
    // Clean up the rest of the extracted clutter so the dir holds one file.
    const entries = await fs.readdir(dir);
    for (const e of entries) {
      if (e !== `model.${picked.ext}`) await fs.rm(path.join(dir, e), { recursive: true, force: true });
    }
    const stat = await fs.stat(target);
    return {
      fileType: picked.ext,
      sizeBytes: stat.size,
      publicPath: `/uploads/models/${id}/model.${picked.ext}`,
    };
  }

  const target = path.join(dir, `model.${ext}`);
  await fs.writeFile(target, buf);
  return { fileType: ext, sizeBytes: buf.length, publicPath: `/uploads/models/${id}/model.${ext}` };
}

/** Upload a model file (.glb/.gltf/.obj/.fbx or a .zip containing one). */
export async function uploadModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a model file to upload." };
  }
  const ext = extOf(file.name);
  if (!(ZIP_EXTS as readonly string[]).includes(ext)) {
    return {
      error: `Unsupported file type ".${ext}". Upload .glb, .gltf, .obj, .fbx, or a .zip containing a GLB/glTF.`,
    };
  }
  if (file.size > MAX_BYTES) {
    return { error: `File too large: ${(file.size / 1048576).toFixed(1)} MB. Limit is 100 MB.` };
  }

  const name =
    String(formData.get("name") ?? "").trim() ||
    path.basename(file.name, path.extname(file.name));

  // Create the row first to claim the id (which becomes the storage dir).
  const row = await prisma.model3D.create({
    data: { name, filePath: "", fileType: ext, sizeBytes: 0, status: "processing" },
  });

  const result = await ingestUpload(row.id, file);
  if ("failed" in result) {
    await prisma.model3D.update({
      where: { id: row.id },
      data: { status: "failed", note: result.failed },
    });
  } else {
    await prisma.model3D.update({
      where: { id: row.id },
      data: {
        filePath: result.publicPath,
        fileType: result.fileType,
        sizeBytes: result.sizeBytes,
        status: "ready",
        note: null,
      },
    });
  }

  await auditLog("model.upload", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: row.id,
    detail: { name, originalName: file.name, ext, sizeBytes: file.size },
  });

  revalidatePath("/admin/3d-studio");
  redirect(`/admin/3d-studio/${row.id}`);
}

/** Map a model to a topic. Enforces one-model-per-topic. */
export async function mapModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");
  const id = Number(formData.get("id"));
  const topicRaw = String(formData.get("topicId") ?? "").trim();
  const topicId = Number(topicRaw);
  if (!Number.isInteger(topicId) || topicId <= 0) {
    return { error: "Topic ID must be a positive integer." };
  }
  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model) return { error: "Model not found." };
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) return { error: `No topic exists with ID ${topicId}.` };
  const clash = await prisma.model3D.findFirst({
    where: { topicId, id: { not: id } },
    select: { id: true, name: true },
  });
  if (clash) {
    return {
      error: `Topic #${topicId} already has model "${clash.name}" (#${clash.id}) mapped. Unmap it first.`,
    };
  }
  await prisma.model3D.update({ where: { id }, data: { topicId } });
  await auditLog("model.map", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: id,
    detail: { topicId, topicName: topic.name },
  });
  revalidatePath(`/admin/3d-studio/${id}`);
  revalidatePath("/admin/3d-studio");
  return { error: null };
}

/** Remove the topic mapping (model stays in the library). */
export async function unmapModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");
  const id = Number(formData.get("id"));
  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model) return { error: "Model not found." };
  await prisma.model3D.update({ where: { id }, data: { topicId: null } });
  await auditLog("model.unmap", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: id,
  });
  revalidatePath(`/admin/3d-studio/${id}`);
  revalidatePath("/admin/3d-studio");
  return { error: null };
}

/** Rename a model. */
export async function renameModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name cannot be empty." };
  if (name.length > 120) return { error: "Name is too long (max 120 chars)." };
  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model) return { error: "Model not found." };
  await prisma.model3D.update({ where: { id }, data: { name } });
  await auditLog("model.rename", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: id,
    detail: { renamedTo: name },
  });
  revalidatePath(`/admin/3d-studio/${id}`);
  revalidatePath("/admin/3d-studio");
  return { error: null };
}

/** Replace the model file (same flow as upload; wipes the dir first). */
export async function replaceModelFile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");
  const id = Number(formData.get("id"));
  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model) return { error: "Model not found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a replacement file to upload." };
  }
  const ext = extOf(file.name);
  if (!(ZIP_EXTS as readonly string[]).includes(ext)) {
    return { error: `Unsupported file type ".${ext}". Upload .glb, .gltf, .obj, .fbx, or a .zip containing a GLB/glTF.` };
  }
  if (file.size > MAX_BYTES) {
    return { error: `File too large: ${(file.size / 1048576).toFixed(1)} MB. Limit is 100 MB.` };
  }

  await prisma.model3D.update({ where: { id }, data: { status: "processing" } });
  const result = await ingestUpload(id, file);
  if ("failed" in result) {
    await prisma.model3D.update({
      where: { id },
      data: { status: "failed", note: result.failed },
    });
    await auditLog("model.upload", {
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "Model3D",
      entityId: id,
      detail: { replaced: false, reason: result.failed },
    });
    revalidatePath(`/admin/3d-studio/${id}`);
    return { error: `Replacement failed: ${result.failed}. The old file was removed — upload a valid file to restore.` };
  }
  await prisma.model3D.update({
    where: { id },
    data: {
      filePath: result.publicPath,
      fileType: result.fileType,
      sizeBytes: result.sizeBytes,
      status: "ready",
      note: null,
    },
  });
  await auditLog("model.upload", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: id,
    detail: { replaced: true, fileType: result.fileType, sizeBytes: result.sizeBytes },
  });
  revalidatePath(`/admin/3d-studio/${id}`);
  revalidatePath("/admin/3d-studio");
  return { error: null };
}

/** Delete a model: remove its file dir, then the DB row. */
export async function deleteModel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("models");
  const id = Number(formData.get("id"));
  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model) return { error: "Model not found." };
  await fs.rm(modelDir(id), { recursive: true, force: true });
  await prisma.model3D.delete({ where: { id } });
  await auditLog("model.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Model3D",
    entityId: id,
    detail: { name: model.name },
  });
  redirect("/admin/3d-studio");
}
