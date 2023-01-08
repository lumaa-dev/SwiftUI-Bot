const Discord = require("discord.js");

module.exports = {
	/**
	 * 
	 * @param {Discord.IntentsBitField[]} intents 
	 * @returns 
	 */
	createClient(intents) {
		const client = new Discord.Client({ intents: intents });
		client.hasContent = intents.includes(Discord.IntentsBitField.Flags.MessageContent);
		if (!client || typeof client == "undefined")
			return console.error("Discord changed the way to get new clients");
		return client;
	},

	/**
	 * 
	 * @param {Discord.Client} client 
	 * @param {String} name 
	 * @param {"PLAYING"|"LISTENING"|"COMPETING"|"WATCHING"} type 
	 */
	async setStatus(client, name, type = "PLAYING") {
		await client.user.setActivity(name, { type: type });
	},
};
