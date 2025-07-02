import {
	Client,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';

export function BanCommandHandler(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Check if it's a button interaction
		if (!interaction.isButton()) return;

		if (interaction.customId === 'cancel_ban_button') {
			await interaction.reply({
				content: 'Ban cancelled.',
				ephemeral: true,
			});
			return;
		}

		// Check if it's the ban button
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('ban_button::')) {
			await handleBanButton(interaction, userId);
		}
	});
}

async function handleBanButton(interaction: ButtonInteraction, userId: string) {
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

		const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			reasonInput,
		);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ UNE SEULE réponse
	} catch (error) {
		console.error('Error while handling ban button:', error);

		// Ne pas tenter de reply si déjà fait
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

// Gestionnaire pour la soumission du modal
export function handleBanModal(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une soumission de modal
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Vérifier si c'est le modal de ban
		if (interaction.customId.startsWith('ban_modal::')) {
			try {
				// Récupérer les valeurs du modal
				const reason =
					interaction.fields.getTextInputValue('ban_reason') ||
					'Aucune raison spécifiée';

				// Vérifier les permissions
				if (!interaction.memberPermissions?.has('BanMembers')) {
					await interaction.reply({
						content: "You don't have permission to ban members.",
						ephemeral: true,
					});
					return;
				}

				// Essayer de bannir l'utilisateur
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
						content: `✅ User <@${userId}> banned successfully.\n**Reason:** ${reason}`,
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
