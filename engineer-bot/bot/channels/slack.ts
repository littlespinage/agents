import { slackChannel } from "@cursor/bdk/channels/slack";

/**
 * Slack channel (Socket Mode).
 *
 * Tokens: ENGINEER_BOT_SLACK_BOT_TOKEN + ENGINEER_BOT_SLACK_APP_TOKEN
 *
 * Full setup: bdk slack create --dir .
 */
export default slackChannel({
  envPrefix: "ENGINEER_BOT",
  suggestedPrompts: [
    { title: "记一个任务", message: "帮我记一个任务：" },
    {
      title: "看项目",
      message: "现在有哪些 Project，各自的目标和完成标准是什么？",
    },
  ],
});
