const Discord = require("discord.js");
const fs = require("fs")
const config = require("./config.json");
const bot = require("./functions/config.json");

const Func = require("./functions/all");
const { createClient } = require("./functions/js/client");
const { Cache, Doc } = require("./apple");
const { InteractionType } = require("discord.js");

const client = createClient([
	Discord.IntentsBitField.Flags.Guilds,
	Discord.IntentsBitField.Flags.GuildBans,
	Discord.IntentsBitField.Flags.GuildMembers,
	Discord.IntentsBitField.Flags.GuildMessages,
	Discord.IntentsBitField.Flags.MessageContent,
]);
const docsCache = new Cache();

client.once("ready", () => {
	console.log(`${client.user.tag} is logged`);
	Func.Client.setStatus(client, "WWDC 2023", "WATCHING");
});

client.on("messageCreate", async (message) => {
	let addCache = true;
	Func.Commands.initiate(client, message);

	// add all to cache
	if (addCache) {
        const docsPath = `${__dirname}${docsCache._data.separator}docs`;
        /**@type {Doc.doc[]} */
		
        const docs = fs.readdirSync(docsPath).filter(file => file.split(".")[1] === "json");
		docs.forEach(doc => {
            /**@type {Doc.doc} */
            const queryDoc = require(docsPath + docsCache._data.separator + doc.split(".")[0]);
			docsCache.add({ doc: queryDoc })
		})
	}
});

client.on("interactionCreate", async (/**@type {import("discord.js").Interaction} */interaction) => {
	if (interaction.isChatInputCommand()) {
		let { commandName: name } = interaction;

		try {
			console.log(`/${name} > ${interaction.user.tag}`);
			await require("./commands/" + name).execute(interaction, client);
		} catch (e) {
			console.error(e);

			if (interaction.replied !== true && interaction.deferred === false) {
				await interaction.reply({
					embeds: [errorCode(e)],
				});
			} else if (
				interaction.deferred === true ||
				interaction.replied === true
			) {
				await interaction.editReply({
					content: "\n",
					attachments: [],
					files: [],
					embeds: [errorCode(e)],
                    components: [],
				});
			}
		}
	} else if (interaction.type == InteractionType.ApplicationCommandAutocomplete) {
		let { commandName: name } = interaction;

		try {
			await require("./commands/" + name).completeAuto(interaction);
		} catch (e) {
			console.error(e);
		}
	} else {
		try {
			await require("./events/interactionCreate").execute(interaction, client);
		} catch (e) {
			console.error(e);

			if (interaction.replied !== true && interaction.deferred === false) {
				await interaction.reply({
					embeds: [errorCode(e)],
				});
			} else if (
				interaction.deferred === true ||
				interaction.replied === true
			) {
				await interaction.editReply({
					content: "\n",
					attachments: [],
					files: [],
					embeds: [errorCode(e)],
                    components: [],
				});
			}
		}
	}
});

/**
 * It returns a Discord.EmbedBuilder object with a title and description
 * @param {String} e - The error message.
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
 function errorCode(e = "Unknown") {
	return new Discord.EmbedBuilder()
		.setTitle("Error:")
		.setDescription(`\`\`\`js\n${e}\`\`\``)
		.setColor("Red");
}

/**@param {Doc} doc */
function docToEmbed(doc) {
	let { doc: apple } = doc;
	const attachment = new Discord.AttachmentBuilder(`./docs/${apple.imagePath.split(docsCache._data.separator).pop()}`)
	return {embeds:[new Discord.EmbedBuilder()
		.setColor("DarkButNotBlack")
		.setTitle(apple.name)
		.setDescription(apple.description)
		.setURL(apple.url)
		.setImage(apple.hasImage ? `attachment://${apple.imagePath.split(docsCache._data.separator).pop()}` : null)
		.setFooter({ text: `Editted the ${fixDate(new Date(apple.editDate))} • Created the ${fixDate(new Date(apple.creationDate))}` })],

		files: [ attachment ]
	}

	/**@param {Date} date */
	function fixDate(date) {
		return `${a(date.getDate())}/${a(date.getMonth()+1)}/${date.getFullYear()} ${a(date.getHours())}:${a(date.getSeconds())}`

		function a(b) {
			if (new String(b).length == 1) return `0${b}`
			else return b;
		}
	}
}

module.exports.error = errorCode;
module.exports.cache = docsCache;
module.exports.embedify = docToEmbed;

client.login(bot.token);
