import { Events, MessageFlags } from 'discord.js';
import type { Client } from 'discord.js';

export default function InteractionCreate(client: Client) {
	client.on(Events.InteractionCreate, async interaction => {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(
					`No command matching ${interaction.commandName} was found.`,
				);
				return;
			}

			try {
				// execute the command
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					// If the interaction has already been replied to or deferred, use followUp
					await interaction.followUp({
						content: 'There was an error while executing this command!',
						flags: MessageFlags.Ephemeral,
					});
				} else {
					// If the interaction has not been replied to yet, use reply
					await interaction.reply({
						content: 'There was an error while executing this command!',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else if (interaction.isButton()) {
			// Handle button interactions here
			if (interaction.customId === 'custom_button') {
				await interaction.reply({
					content: 'You clicked the custom button!',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	});
}
