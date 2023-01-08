const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    data: {
		name: "create",
		description: "Create a doc",
        options: [
            {
                name: "element",
                description: "The element",
                required: true,
				type: ApplicationCommandOptionType.String,
            },
            {
                name: "image",
                description: "An depictation of the element",
                required: true,
				type: ApplicationCommandOptionType.Attachment,
            }
        ]
	},
	customData: {
		usage: ["/create [element] [attachment]"],
		dev: false,
	},

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client?} client 
     */
	async execute(interaction, client) {
    }
}