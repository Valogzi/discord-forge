import { SlashCommandBuilder } from 'discord.js';
import type { Interaction, CacheType } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!');

export async function execute(interaction: Interaction<CacheType>) {
	if (!interaction.isCommand()) return;

	interaction.reply({
		content: 'Pong!',
		ephemeral: true,
	});
}
