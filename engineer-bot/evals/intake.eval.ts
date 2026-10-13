import { defineEval, includes } from "@cursor/bdk/evals";

const intakeShape = /上下文摘要[\s\S]+Project[\s\S]+目标[\s\S]+完成标准/;

function hasIntakeFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const input = value as {
    project?: string;
    contextSummary?: string;
    goal?: string;
    doneWhen?: string;
  };
  return Boolean(
    input.project?.trim() &&
      input.contextSummary?.trim() &&
      input.goal?.trim() &&
      input.doneWhen?.trim() &&
      !/做好了/.test(input.doneWhen),
  );
}

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "new-task",
      description: "A new task is summarized, filed, and answered in the intake shape.",
      async test(t) {
        await t.send(
          "Sam 在 #eng 说：登录页在 Safari 上白屏，从今天早上开始，只影响 iOS 17。请记下来。",
        );
        t.succeeded();
        t.toolOrder(["list_projects", "record_task"]);
        t.calledTool("record_task", {
          status: "completed",
          input: hasIntakeFields,
        });
        t.check(t.reply, includes(intakeShape));
      },
    },
    {
      id: "same-project",
      description: "Related work reuses the named Project instead of opening another one.",
      async test(t) {
        await t.send(
          "已有 Project 名字就是 Checkout，里面是导出失败。新任务：XLSX 导出也 500，Sam 提的，request id 88b。请归到 Checkout，不要新开 Project。",
        );
        t.succeeded();
        t.toolOrder(["list_projects", "record_task"]);
        t.calledTool("record_task", {
          status: "completed",
          input: { project: "Checkout" },
        });
        t.check(t.reply, includes(intakeShape));
      },
    },
    {
      id: "status",
      description: "A status question lists projects and does not record a task.",
      async test(t) {
        await t.send("现在有哪些 Project？只查询，不要记新任务。");
        t.succeeded();
        t.calledTool("list_projects");
        t.notCalledTool("record_task");
      },
    },
  ],
});
