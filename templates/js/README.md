# Rapid Setup

⚠️ This CLI make a private bot, to make a public bot, you must use the default publishing method without guildId

see https://discordjs.guide/creating-your-bot/command-deployment.html#global-commands

### 1 - Configure config.json

Set your guildId, clientId and token to run the bot.

### 2 - Deploy and start the bot

With npm:

```
npm i (if you have set without auto install in CLI)
```

```
npm run deployCommands
npm run start
```

With pnpm:

```
pnpm i (if you have set without auto install in CLI)
```

```
pnpm run deployCommands
pnpm run start
```
