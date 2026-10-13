import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod/v3";
import { readStore } from "../lib/projects.js";

const CLIP = 400;

function clip(text: string): string {
  if (text.length <= CLIP) return text;
  return `${text.slice(0, CLIP - 1)}…`;
}

export default defineTool({
  description:
    "List every Project and its tasks. This is the only source of truth for which Project a task belongs to. Call it before recording a task, and whenever someone asks what is in progress.",
  inputSchema: z.object({}),
  effect: "read",
  async execute(_input, ctx) {
    const store = await readStore(ctx.host.kv);
    const projects = store.projects
      .map((project) => ({
        name: project.name,
        summary: project.summary,
        tasks: project.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          requester: task.requester,
          contextSummary: clip(task.contextSummary),
          goal: task.goal,
          doneWhen: task.doneWhen,
          createdAt: task.createdAt,
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { projects };
  },
});
