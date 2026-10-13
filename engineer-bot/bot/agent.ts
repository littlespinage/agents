import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  name: "engineer-bot",
  description: "接到任务先摘要上下文，相关任务归到同一个 Project，并写清目标和完成标准。",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  tools: ["read", "grep", "glob", "ls"],
  local: {
    sandbox: true,
  },
});
