import { randomUUID } from "node:crypto";
import { prompt } from "@cursor/bdk";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod/v3";
import { normalizeKey, updateStore, type TaskRecord } from "../lib/projects.js";

const inputSchema = z.object({
  project: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .describe("Existing Project name when the work is related. A new short stable name only when nothing matches."),
  projectSummary: z
    .string()
    .trim()
    .max(240)
    .optional()
    .default("")
    .describe("One line on what this Project is about. Ignored once the Project already has a summary."),
  title: z.string().trim().min(1).max(120).describe("Short task title. The same title in a Project is the same task."),
  requester: z
    .string()
    .trim()
    .max(80)
    .optional()
    .default("")
    .describe("Who asked. Use 未知 when the message does not say."),
  contextSummary: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .describe("Who asked, what problem, constraints, and background. Mark unknowns. Do not invent."),
  goal: z.string().trim().min(1).max(500).describe("What done work achieves. One concrete outcome."),
  doneWhen: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe("How to tell it is finished. Must be checkable, not 'it is done'."),
});

export default defineTool({
  description: prompt`
    Record one task under a Project.
    Call list_projects first. Reuse an existing Project name for related work.
    Call this once per new task, after the context summary, goal, and done criteria are known.
  `,
  inputSchema,
  effect: "write",
  dryRunResult: (input) => ({
    created: false,
    projectCreated: false,
    project: input.project,
    task: {
      id: "dry-run",
      title: input.title,
      requester: input.requester,
      contextSummary: input.contextSummary,
      goal: input.goal,
      doneWhen: input.doneWhen,
      createdAt: "",
    },
  }),
  async execute(input, ctx) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const projectKey = normalizeKey(input.project);
    const titleKey = normalizeKey(input.title);

    return updateStore(ctx.host.kv, (store) => {
      const projects = store.projects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) => ({ ...task })),
      }));
      let project = projects.find((item) => normalizeKey(item.name) === projectKey);
      let projectCreated = false;
      if (!project) {
        project = {
          name: input.project.trim().replace(/\s+/g, " "),
          summary: input.projectSummary.trim(),
          tasks: [],
        };
        projects.push(project);
        projectCreated = true;
      } else if (!project.summary && input.projectSummary.trim()) {
        project.summary = input.projectSummary.trim();
      }

      const existing = project.tasks.find((task) => normalizeKey(task.title) === titleKey);
      const task: TaskRecord = existing ?? {
        id,
        title: input.title.trim(),
        requester: input.requester.trim(),
        contextSummary: input.contextSummary.trim(),
        goal: input.goal.trim(),
        doneWhen: input.doneWhen.trim(),
        createdAt,
      };
      if (!existing) project.tasks.push(task);

      return {
        store: { projects },
        result: {
          created: !existing,
          projectCreated,
          project: project.name,
          task,
        },
      };
    });
  },
});
