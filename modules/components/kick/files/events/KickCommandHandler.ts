import {
	Client,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';

export function KickCommandHandler(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a button interaction
		if (!interaction.isButton()) return;

		// Check if it's the kick button
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('kick_button::')) {
			await handleKickButton(interaction, userId);
		}
	});
}

async function handleKickButton(
	interaction: ButtonInteraction,
	userId: string,
) {
	if (interaction.replied || interaction.deferred) return;

	try {
		// Create a modal
		const modal = new ModalBuilder()
			.setCustomId(`kick_modal::${userId}`)
			.setTitle('Kick a user');

		const reasonInput = new TextInputBuilder()
			.setCustomId('kick_reason')
			.setLabel('Kick reason')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Server rules violation...')
			.setMaxLength(512);

		const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			reasonInput,
		);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ ONLY ONE response
	} catch (error) {
		console.error('Error handling kick button:', error);

		// Do not attempt to reply if already done
		if (!interaction.replied && !interaction.deferred) {
			try {
				await interaction.reply({
					content: 'An error occurred while processing your request.',
					ephemeral: true,
				});
			} catch (e) {
				console.error('Error during fallback reply:', e);
			}
		}
	}
}

// Handler for modal submission
export function handleKickModal(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a modal submission
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Check if it's the kick modal
		if (interaction.customId.startsWith('kick_modal::')) {
			try {
				// Retrieve modal values
				const reason =
					interaction.fields.getTextInputValue('kick_reason') ||
					'No reason specified';

				// Check permissions
				if (!interaction.memberPermissions?.has('KickMembers')) {
					await interaction.reply({
						content: "You don't have permission to kick members.",
						ephemeral: true,
					});
					return;
				}

				// Attempt to kick the user
				const guild = interaction.guild;
				if (!guild) {
					await interaction.reply({
						content: 'This command can only be used in a server.',
						ephemeral: true,
					});
					return;
				}

				try {
					const guildMember = await guild.members.fetch(userId);
					await guildMember.kick(
						`Kicked by ${interaction.user.tag}: ${reason}`,
					);

					await interaction.reply({
						content: `✅ User <@${userId}> kicked successfully.\n**Reason:** ${reason}`,
						ephemeral: true,
					});
				} catch (kickError) {
					console.error('Error during kick:', kickError);
					await interaction.reply({
						content:
							'❌ Unable to kick this user. Check the ID and my permissions.',
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error('Error during modal submission:', error);

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: 'An error occurred while processing your request.',
						ephemeral: true,
					});
				}
			}
		}
	});
}
