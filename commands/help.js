const fs = require("fs");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { onlyJs } = require("../functions/js/cmds");
const { error } = require("../main");

module.exports = {
	data: {
		name: "help",
		description: "Get informations about commands",
		options: [
			{
				name: "command",
				description: "The command you need to know about",
				type: ApplicationCommandOptionType.String,
				autocomplete: true,
				required: false,
			},
		],
	},
	customData: {
		dev: false,
		usage: ["/help [command]*"],
	},
	async execute(interaction) {
		const input = interaction.options?.getString("command");

		if (input !== null) {
			var data, customData;
			try {
				const { data: dataB, customData: customDataB } = require("./" + input);
				data = dataB;
				customData = customDataB;
			} catch (e) {
				return interaction.reply({
					embeds: [error("Command not found.")],
					ephemeral: true,
				});
			}
			const ephemeral = customData.dev ? true : false;
			await interaction.deferReply({ ephemeral: ephemeral });

			const cmdEmbed = new EmbedBuilder()
				.setTitle(`/${data.name}${ephemeral ? " - Developper Command" : ""}`)
				.setDescription(
					`*${data.description}*\nUsage : ${arrayToCorrectString(
						customData.usage
					)}`
				)
				//.setFooter({ text: customData.category })
				.setColor("Random");

			await interaction.editReply({ embeds: [cmdEmbed] });
		} else {
			var cmdsNames = [];
			await interaction.deferReply({ ephemeral: false });
			const filtered = await filterCmds(false, false);
			filtered.forEach((cmd) => cmdsNames.push(`\`/${cmd.data.name}\``));

			cmdsNames.toString().replace(/,/g, ", ");

			const helpEmbed = new EmbedBuilder()
				.setTitle("Available commands :")
				.setDescription(`\nCommands : ${arrayToCorrectString(cmdsNames)}`)
				.setFooter({
					text: "Use /help [command] to get more informations about a certain command",
				})
				.setColor("Blurple");

			interaction.editReply({ embeds: [helpEmbed] });
		}
	},
	async completeAuto(interaction) {
		const input = interaction.options.getFocused();

		const cmds = await filterCmds(false);
		const filtered = cmds.filter((cmd) => {
			if (cmd.data.name !== "help") {
				return cmd.data.name.startsWith(input.trim());
			}
		});

		await interaction.respond(
			filtered.map((cmd) => ({ name: cmd.data.name, value: cmd.data.name }))
		);
	},
};

/**
 * It reads the commands folder, filters out the non-js files
 * @param {Boolean} separated - true/false (just false now)
 * @param {Boolean} hasDev - Includes developper commands
 * @returns {Object} An array
 */
async function filterCmds(separated = true, hasDev = false) {
	separated = false;
	const fileSep = __dirname.includes("/") ? "/" : "\\";
	const filePath = __dirname.split(/\/|\\/g).slice(0, -1).join(fileSep);
	const files = await fs.readdirSync(filePath + "/commands");
	const cmds = onlyJs(files);

	var result;
	cmds.sort((a, b) => {
		const aData = require("../commands/" + a.replace(".js", ""));
		const bData = require("../commands/" + b.replace(".js", ""));
		aData.data.name.normalize().localeCompare(bData.data.name.normalize());
	});

	cmds.forEach((cmd) => {
		const data = require("../commands/" + cmd.replace(".js", ""));

		if (separated === true) {
			throw new SyntaxError("No categories in commands");
			const category = data.customData.category;
			var categories = {
				mods: [],
				ints: [],
				else: [],
				devs: [],
			};

			if (data.customData.dev === true)
				categories.devs.push({
					data: data.data,
					customData: data.customData,
					name: para.categoriesName[3],
				});
			if (category === "mods")
				categories.mods.push({
					data: data.data,
					customData: data.customData,
					name: para.categoriesName[0],
				});
			if (category === "ints")
				categories.ints.push({
					data: data.data,
					customData: data.customData,
					name: para.categoriesName[1],
				});
			if (category === "else")
				categories.else.push({
					data: data.data,
					customData: data.customData,
					name: para.categoriesName[2],
				});

			result = categories;
			return categories;
		} else {
			if (!Array.isArray(result)) result = [];
			if (
				(hasDev === true && data.customData.dev === true) ||
				data.customData.dev !== true
			)
				result.push({ data: data.data, customData: data.customData });
			return result;
		}
	});

	return result;
}

/**
 * It takes an array of categories and returns a string of the categories
 * @param {Array<String>} categories - An array of categories.
 * @returns {String} A string of categories with "code" markdown.
 */
function arrayToCorrectString(categories) {
	var array = [];
	categories.forEach((category) => array.push(`\`${category}\``));

	return array.toString().replace(/,/g, ", ");
}
