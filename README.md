# Discord-Forge

A CLI made with Commander to create a Discord and easily add advanced features to your bot made with discord.js in TypeScript or JavaScript

See the [documentation](https://discord-forge-doc.vercel.app)

## Authors

- [@valogzi](https://www.github.com/valogzi)

## Usage

Run create-discord-forge CLI

with npm:

```bash
  npx create-discord-forge@latest
```

---

with pnpm:

```bash
  pnpx create-discord-forge@latest
  # or
  pnpm dlx create-discord-forge@latest
```

## Add feature to project

You can add many independent components with the CLI, make sure you run the CLI with the latest version so you don't miss new components

---

### Available components

- Ban
- Kick
- Warn

### How to install

[Components] is an optional argument

_Please note that the CLI does not work without an index in the root of a src folder._

with npm

```bash
  npx create-discord-forge@latest add [components]
```

with pnpm

```bash
  pnpx create-discord-forge@latest add [components]
  # or
  pnpm dlx create-discord-forge@latest add [components]
```

# CLI Options Reference

## Global CLI Options

| Option | Description | Default |
| --- | --- | --- |
| `--name <name>` | Set the project name | `discord-forge` |
| `--template <template>` | Set the template to use | `default` |
| `--typescript`, `-t` | Use TypeScript instead of JavaScript | `false` |
| `--dependencies`, `-d` | Install dependencies after scaffolding | `true` |
| `--engine <engine>` | Set the engine to use | `default` |
| `--version` | Show CLI version | `0.1.0` |
| `--help` | Show help | — |

---

## `add` Command

### Arguments

| Argument | Description |
| --- | --- |
| `[features...]` | List of features/modules to add (e.g., `ban`, `kick`, `command-slash`) |

### Options

| Option               | Description            |
| -------------------- | ---------------------- |
| `--typescript`, `-t` | Use TypeScript modules |

## License

[MIT](https://choosealicense.com/licenses/mit/)
