const { ChatInputCommandInteraction, Client, AutocompleteInteraction, ApplicationCommandOptionType, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, ActionRowBuilder } = require("discord.js");
const { error, cache } = require("../main")
const { ownerId } = require("../functions/config.json")
const { Doc } = require("../apple")
const fs = require("fs")
const { awaitModal } = require("../functions/js/cmds");

module.exports = {
	data: {
		name: "edit",
		description: "Make an edit request",
        options: [
            {
                name: "doc",
                description: "An available doc",
                required: true,
                autocomplete: true,
				type: ApplicationCommandOptionType.String,
            }
        ]
	},
	customData: {
		usage: ["/edit [doc]"],
		dev: true,
	},

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client?} client 
     */
	async execute(interaction, client) {
        const docName = interaction.options.getString("doc")
        const docsPath = __dirname.replace("commands", "docs");

        const docs = fs.readdirSync(docsPath)
        .filter(file => file.split(".")[1] === "json")
        .map(file => file.replace(".json", ""));

        if (docs.includes(docName)) {
            const doc = docs.filter(file => file === docName)[0]
            /**
             * @type {Doc}
             */
            const objectDoc = { doc: require(`../docs/${doc}`) }

            const descriptionField = new TextInputBuilder()
            .setLabel("Suggest a new description")
            .setPlaceholder("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(objectDoc.doc.description)
            .setCustomId("edition")
            .setMinLength(1)
            .setMaxLength(4000)

            const modal = new ModalBuilder()
            .setTitle(`Editting "${objectDoc.doc.name}"`)
            .addComponents(new ActionRowBuilder().setComponents(descriptionField))   
            .setCustomId("editDoc")
            
            interaction.guild.editModal = objectDoc;
            await interaction.showModal(modal);
        } else {
            error("You haven't sent a correct doc.")
        }
    },

    /**
     * @param {AutocompleteInteraction} interaction 
     * @param {Client?} client 
     */
    async completeAuto(interaction, client) {
        const focusedOption = interaction.options.getFocused();
        const docsPath = __dirname.replace("commands", "docs");
        /**@type {Object[]} */
        var choices = [];
		
        const docs = fs.readdirSync(docsPath).filter(file => file.split(".")[1] === "json");
        docs.forEach(doc => {
            /**@type {Doc.doc} */
            const queryDoc = require(docsPath + cache._data.separator + doc.split(".")[0]);
            choices.push(queryDoc);
        })

		const filtered = choices.filter(doc => doc.name.startsWith(focusedOption) );
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.fileName.split(".")[0] })),
		);
    }
}