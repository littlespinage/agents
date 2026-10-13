import { supportsKvCas, type HostKvApi, type JsonValue } from "@cursor/bdk";

export const PROJECTS_KEY = "engineer-projects";

export type TaskRecord = {
  id: string;
  title: string;
  requester: string;
  contextSummary: string;
  goal: string;
  doneWhen: string;
  createdAt: string;
};

export type ProjectRecord = {
  name: string;
  summary: string;
  tasks: TaskRecord[];
};

export type ProjectStore = {
  projects: ProjectRecord[];
};

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseStore(value: JsonValue | undefined): ProjectStore {
  if (!isRecord(value) || !Array.isArray(value.projects)) {
    return { projects: [] };
  }
  const projects: ProjectRecord[] = [];
  for (const entry of value.projects) {
    if (!isRecord(entry)) continue;
    const name = asString(entry.name).trim();
    if (!name) continue;
    const tasks: TaskRecord[] = [];
    if (Array.isArray(entry.tasks)) {
      for (const task of entry.tasks) {
        if (!isRecord(task)) continue;
        const title = asString(task.title).trim();
        const id = asString(task.id);
        if (!title || !id) continue;
        tasks.push({
          id,
          title,
          requester: asString(task.requester),
          contextSummary: asString(task.contextSummary),
          goal: asString(task.goal),
          doneWhen: asString(task.doneWhen),
          createdAt: asString(task.createdAt),
        });
      }
    }
    projects.push({
      name,
      summary: asString(entry.summary),
      tasks,
    });
  }
  return { projects };
}

function toJson(store: ProjectStore): JsonValue {
  return {
    projects: store.projects.map((project) => ({
      name: project.name,
      summary: project.summary,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        requester: task.requester,
        contextSummary: task.contextSummary,
        goal: task.goal,
        doneWhen: task.doneWhen,
        createdAt: task.createdAt,
      })),
    })),
  };
}

export async function readStore(kv: HostKvApi): Promise<ProjectStore> {
  return parseStore(await kv.get(PROJECTS_KEY));
}

export async function updateStore<T>(
  kv: HostKvApi,
  mutate: (store: ProjectStore) => { store: ProjectStore; result: T },
): Promise<T> {
  if (supportsKvCas(kv)) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await kv.getWithVersion(PROJECTS_KEY);
      const next = mutate(parseStore(current?.value));
      const saved = toJson(next.store);
      if (!current) {
        const created = await kv.putIfAbsent(PROJECTS_KEY, saved);
        if (created.ok) return next.result;
        continue;
      }
      const replaced = await kv.putIfVersion(PROJECTS_KEY, saved, current.version);
      if (replaced.ok) return next.result;
    }
    throw new Error("project store changed while saving; call the tool again");
  }

  const next = mutate(parseStore(await kv.get(PROJECTS_KEY)));
  await kv.put(PROJECTS_KEY, toJson(next.store));
  return next.result;
}
