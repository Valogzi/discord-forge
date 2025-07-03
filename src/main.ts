#!/usr/bin/env node

import { Command } from 'commander';
import mainAction from './core/mainAction';
import { handleAddCommand } from './core/handleAddCommand';

const program = new Command();

program
	.name('create-discord-forge')
	.description(
		'A CLI tool for creating Discord bots whith operational templates.',
	)
	.option('--name <name>', "Set the project name (default: 'discord-forge')")
	.option(
		'--template <template>',
		'Set the template to use (default: "default")',
	)
	.option('--typescript, -t', 'Use TypeScript (default: JavaScript)')
	.option('--dependencies, -d', 'Install dependencies (default: true)')
	.option('--engine <engine>', 'Set the engine to use (default: "default")')
	.version('0.1.0')
	.action(() => {
		const options = program.opts();

		const name = options.name;
		const template = options.template;
		const typescript = options.typescript;
		const dependencies = options.dependencies;
		const engine = options.engine;
		mainAction(name, template, typescript, dependencies, engine);
	});

program
	.command('add')
	.description('Add new features to your bot')
	.argument('[features...]', 'Features to add (e.g., ban kick)')
	.option('--typescript, -t', 'Use TypeScript (default: JavaScript)')
	.action(features => {
		const typescript = program.opts().typescript;
		handleAddCommand(typescript, features);
	});

program.parse();
