const { Events } = require('discord.js');

module.exports = client => {
	client.once(Events.ClientReady, readyClient => {
		console.log(`Ready! Logged in as ${readyClient.user.tag}`);

		client.user.setPresence({
			activities: [{ name: 'Made with discord-forge CLI', type: 0 }],
			status: 'online',
		});
	});
};
