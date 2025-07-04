import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
	if (!interaction.isCommand()) return;

	interaction.reply({
		content: 'Pong!',
		ephemeral: true,
	});
}
