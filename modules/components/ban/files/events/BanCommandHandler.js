const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} = require('discord.js');

function BanCommandHandler(client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a button interaction
		if (!interaction.isButton()) return;

		// Check if it's the ban button
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('ban_button::')) {
			await handleBanButton(interaction, userId);
		}
	});
}

async function handleBanButton(interaction, userId) {
	if (interaction.replied || interaction.deferred) return;

	try {
		// Create a modal
		const modal = new ModalBuilder()
			.setCustomId(`ban_modal::${userId}`)
			.setTitle('Ban a user');

		const reasonInput = new TextInputBuilder()
			.setCustomId('ban_reason')
			.setLabel('Ban reason')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Server rules violation...')
			.setMaxLength(512);

		const reasonRow = new ActionRowBuilder().addComponents(reasonInput);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ ONE response only
	} catch (error) {
		console.error('Error while handling ban button:', error);

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
function handleBanModal(client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a modal submission
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Check if it's the ban modal
		if (interaction.customId.startsWith('ban_modal::')) {
			try {
				// Retrieve modal values
				const reason =
					interaction.fields.getTextInputValue('ban_reason') ||
					'No reason specified';

				// Check permissions
				if (!interaction.memberPermissions?.has('BanMembers')) {
					await interaction.reply({
						content: "You don't have permission to ban members.",
						ephemeral: true,
					});
					return;
				}

				// Try to ban the user
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
					await guildMember.ban({
						reason: `Banned by ${interaction.user.tag}: ${reason}`,
					});

					await interaction.reply({
						content: `✅ User <@${userId}> successfully banned.\n**Reason:** ${reason}`,
						ephemeral: true,
					});
				} catch (banError) {
					console.error('Error while banning:', banError);
					await interaction.reply({
						content:
							'❌ Unable to ban this user. Check the ID and my permissions.',
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

module.exports = { BanCommandHandler, handleBanModal };
