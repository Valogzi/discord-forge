const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} = require('discord.js');

function WarnCommandHandler(client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a button interaction
		if (!interaction.isButton()) return;

		// Check if it's the warn button
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('warn_button::')) {
			await handleWarnButton(interaction, userId);
		}
	});
}

async function handleWarnButton(interaction, userId) {
	if (interaction.replied || interaction.deferred) return;

	try {
		// Create a modal
		const modal = new ModalBuilder()
			.setCustomId(`warn_modal::${userId}`)
			.setTitle('Warn a user');

		const reasonInput = new TextInputBuilder()
			.setCustomId('warn_reason')
			.setLabel('Warning reason')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Server rules violation...')
			.setMaxLength(512);

		const reasonRow = new ActionRowBuilder().addComponents(reasonInput);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ SINGLE response only
	} catch (error) {
		console.error('Error while handling warn button:', error);

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
function handleWarnModal(client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a modal submission
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Check if it's the warn modal
		if (interaction.customId.startsWith('warn_modal::')) {
			try {
				// Get modal values
				const reason =
					interaction.fields.getTextInputValue('warn_reason') ||
					'No reason specified';

				// Check permissions
				if (!interaction.memberPermissions?.has('ModerateMembers')) {
					await interaction.reply({
						content: "You don't have permission to warn members.",
						ephemeral: true,
					});
					return;
				}

				// Try to warn the user
				const guild = interaction.guild;
				if (!guild) {
					await interaction.reply({
						content: 'This command can only be used in a server.',
						ephemeral: true,
					});
					return;
				}

				try {
					// In a real implementation, you would store the warning in a database
					// For now, we'll just send a confirmation message
					const guildMember = await guild.members.fetch(userId);
					const warnEmbed = new EmbedBuilder()
						.setColor('#FFA500')
						.setTitle('⚠️ Warning')
						.setDescription(`You received a warning in **${guild.name}**.`)
						.addFields({ name: 'Reason:', value: reason });

					await guildMember.send({ embeds: [warnEmbed] });

					await interaction.reply({
						content: `✅ User <@${userId}> warned successfully.\n**Reason:** ${reason}`,
						ephemeral: true,
					});
				} catch (warnError) {
					console.error('Error while warning:', warnError);
					await interaction.reply({
						content:
							'❌ Unable to warn this user. Check the ID and my permissions.',
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

module.exports = { WarnCommandHandler, handleWarnModal };
