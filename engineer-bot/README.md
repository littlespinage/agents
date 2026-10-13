# engineer-bot

Slack 里的工程师 bot。接到任务后先摘要上下文，把相关任务归到同一个 Project，并写清目标和完成标准。Project 存在 bot 自己的存储里。

## 本地

```bash
bdk validate --dir .
bdk call list_projects --dir . --input '{}'
bdk serve --dir . --mode single --dev
```

## Slack

提到 bot，或私信它，就会接任务。频道里不 @ 也能唤醒需要频道 id，当前没有开。

连接 Slack 应用（会打开浏览器，把 token 写进 `.env.local`）：

```bash
bdk slack create --dir . --name "engineer-bot"
bdk slack doctor --prefix ENGINEER_BOT
```
