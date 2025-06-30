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
	.version('0.1.0')
	.action(mainAction);

program
	.command('add')
	.description('Add a new feature to your bot')
	.argument('[feature]', 'Feature to add')
	.action(feature => {
		handleAddCommand(feature);
	});

program.parse();
