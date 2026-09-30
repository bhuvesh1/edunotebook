// app/admin/ai-studio/new/page.tsx — queue a new AI generation job.
// Nothing runs automatically: after creation the job sits in "queued" until
// an admin clicks Run on its detail page.
import { requirePermission } from "@/lib/admin";
import { AdminForm, Field, inputCls } from "../../ui";
import { createAiJob } from "./actions";

export default async function NewAiJobPage() {
  await requirePermission("ai");

  return (
    <div>
      <h1 className="mb-4 font-hand text-2xl font-bold">New AI job</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600">
        Queue a generation job. It will wait in <em>queued</em> status — you
        run it, review its output, and approve/publish it from the job page.
        Nothing publishes automatically.
      </p>
      <AdminForm
        action={createAiJob}
        submitLabel="Queue job"
        cancelHref="/admin/ai-studio"
      >
        <Field label="Job kind" name="kind">
          <select name="kind" id="kind" className={inputCls} defaultValue="topic-content">
            <option value="topic-content">Topic content — study article (title, summary, equations, explanation)</option>
            <option value="blog">Blog — SEO article outline</option>
            <option value="quiz">Quiz — 5 MCQs as JSON</option>
            <option value="translation">Translation — translate provided text, formulas preserved</option>
          </select>
        </Field>
        <Field
          label="Subject slug"
          name="subjectSlug"
          hint="e.g. physics, chemistry, mathematics. Used to focus the prompt."
        >
          <input name="subjectSlug" id="subjectSlug" className={inputCls} placeholder="physics" />
        </Field>
        <Field
          label="Topic ID (optional)"
          name="topicId"
          hint="Links the job to a topic. Required for blog/topic-content publish targets."
        >
          <input name="topicId" id="topicId" className={inputCls} inputMode="numeric" placeholder="e.g. 42" />
        </Field>
        <Field
          label="Prompt parameters / extra instructions"
          name="input"
          hint="For translation: the target language and the text to translate. For others: any extra instructions for the model."
        >
          <textarea name="input" id="input" className={inputCls} rows={5} placeholder="Target language: Hindi.&#10;&#10;Text to translate:&#10;..." />
        </Field>
      </AdminForm>
    </div>
  );
}
