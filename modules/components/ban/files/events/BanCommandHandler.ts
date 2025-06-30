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
		// Vérifier si c'est une interaction de bouton
		if (!interaction.isButton()) return;

		// Vérifier si c'est le bouton de ban
		if (interaction.customId === 'ban_button') {
			await handleBanButton(interaction);
		}
	});
}

async function handleBanButton(interaction: ButtonInteraction) {
	try {
		// Créer un modal pour demander la raison du ban
		const modal = new ModalBuilder()
			.setCustomId('ban_modal')
			.setTitle('Bannir un utilisateur');

		// Champ pour l'ID de l'utilisateur
		const userIdInput = new TextInputBuilder()
			.setCustomId('user_id')
			.setLabel("ID de l'utilisateur à bannir")
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder('123456789012345678');

		// Champ pour la raison du ban
		const reasonInput = new TextInputBuilder()
			.setCustomId('ban_reason')
			.setLabel('Raison du bannissement')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Violation des règles du serveur...')
			.setMaxLength(512);

		// Créer les lignes d'action
		const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			userIdInput,
		);
		const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			reasonInput,
		);

		// Ajouter les composants au modal
		modal.addComponents(userIdRow, reasonRow);

		// Afficher le modal
		await interaction.showModal(modal);
	} catch (error) {
		console.error('Erreur lors de la gestion du bouton ban:', error);

		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: 'Une erreur est survenue lors du traitement de votre demande.',
				ephemeral: true,
			});
		}
	}
}

// Gestionnaire pour la soumission du modal
export function handleBanModal(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une soumission de modal
		if (!interaction.isModalSubmit()) return;

		// Vérifier si c'est le modal de ban
		if (interaction.customId === 'ban_modal') {
			try {
				// Récupérer les valeurs du modal
				const userId = interaction.fields.getTextInputValue('user_id');
				const reason =
					interaction.fields.getTextInputValue('ban_reason') ||
					'Aucune raison spécifiée';

				// Vérifier les permissions
				if (!interaction.memberPermissions?.has('BanMembers')) {
					await interaction.reply({
						content: "Vous n'avez pas la permission de bannir des membres.",
						ephemeral: true,
					});
					return;
				}

				// Essayer de bannir l'utilisateur
				const guild = interaction.guild;
				if (!guild) {
					await interaction.reply({
						content:
							'Cette commande ne peut être utilisée que dans un serveur.',
						ephemeral: true,
					});
					return;
				}

				try {
					await guild.members.ban(userId, {
						reason: `Banni par ${interaction.user.tag}: ${reason}`,
					});

					await interaction.reply({
						content: `✅ Utilisateur <@${userId}> banni avec succès.\n**Raison:** ${reason}`,
						ephemeral: true,
					});
				} catch (banError) {
					console.error('Erreur lors du bannissement:', banError);
					await interaction.reply({
						content:
							"❌ Impossible de bannir cet utilisateur. Vérifiez l'ID et mes permissions.",
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error('Erreur lors de la soumission du modal:', error);

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content:
							'Une erreur est survenue lors du traitement de votre demande.',
						ephemeral: true,
					});
				}
			}
		}
	});
}
