import {
	Client,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';

function KickCommandHandler(client) {
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

async function handleKickButton(interaction, userId) {
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

		const reasonRow = new ActionRowBuilder().addComponents(reasonInput);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ ONE response only
	} catch (error) {
		console.error('Error while handling kick button:', error);

		// Don't attempt to reply if already done
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
function handleKickModal(client) {
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

				// Try to kick the user
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
					await guildMember.kick(`Kick by ${interaction.user.tag}: ${reason}`);

					await interaction.reply({
						content: `✅ User <@${userId}> kicked successfully.\n**Reason:** ${reason}`,
						ephemeral: true,
					});
				} catch (kickError) {
					console.error('Error while kicking:', kickError);
					await interaction.reply({
						content:
							'❌ Unable to kick this user. Check the ID and my permissions.',
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error('Error while submitting the modal:', error);

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

module.exports = { KickCommandHandler, handleKickModal };
