const { ChatInputCommandInteraction, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageMentions, ActionRow, AutocompleteInteraction, ApplicationCommandOptionType, ButtonStyle } = require("discord.js");
const fs = require("fs");
const { Doc } = require("../apple");
const { cache, embedify, error } = require("../main");

module.exports = {
	data: {
		name: "search",
		description: "Searches through all the available docs",
        options: [
            {
                name: "query",
                description: "The query of your research",
                required: true,
                autocomplete: true,
				type: ApplicationCommandOptionType.String,
            }
        ]
	},
	customData: {
		usage: ["/search [query]"],
		dev: false,
	},

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client?} client 
     */
	execute(interaction, client) {
		const query = interaction.options.getString("query").trim();
        // var results = cache.search(query, { byDescription: false, byName: true, exactName: false })
        var results = [];
        
        if (results.length > 1) {
            var embed = new EmbedBuilder()
            .setColor("Aqua")
            .setTitle(`${results.length} results`)
            .setDescription("Here are the docs that matches your query:\n\n")
        } else {
            const docsPath = __dirname.replace("commands", "docs");
            
            try {
                results = [{doc:require(docsPath + cache._data.separator + query)}];

                if (typeof results[0].doc.fileName !== "string") {
                    var embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`No results`)
                    .setDescription(`No docs matches the query '\`${query}\`'`);
        
                    return interaction.reply({embeds: [embed], allowedMentions: { repliedUser: true }})
                } else {
                    var embed = new EmbedBuilder()
                    .setColor("Aqua")
                    .setTitle(`${results.length} results`)
                    .setDescription("Here are the docs that matches your query:\n\n")
                }
            } catch (e) {
                console.error(e)
                return interaction.reply({embeds: [error("There were no results to your query")]})
            }
        }

        /**@type {ActionRowBuilder[]} */
        const actionrows = []
        const total = []
        /**@type {ActionRowBuilder?} */
        var actionrow = null;

        if (results.length == 1) {
            return interaction.reply(embedify(results[0]));
        }
        
        results.forEach((/**@type {Doc} */result) => {
            const isFirst = results.indexOf(result) == 0;
            let string = `${!isFirst ? "\n" : "**"}[${result.doc.name}](${result.doc.url})${isFirst ? "**" : ""}`;
            var embedJson = embed.data
            embedJson.description = embedJson.description + string;

            if (actionrow == null || actionrow.components.length >= 5) {
                actionrow = new ActionRowBuilder()
                actionrows.push(actionrow);

                let button = new ButtonBuilder()
                .setCustomId(`doc_${result.doc.fileName}`)
                .setLabel(result.doc.name)
                .setDisabled(result.doc.beta ?? false)
                .setStyle(ButtonStyle.Secondary)
    
                total.push(button)
                actionrow.addComponents(button)
            } else if (actionrows.length < 5) {
                let button = new ButtonBuilder()
                .setCustomId(`doc_${result.doc.fileName}`)
                .setLabel(result.doc.name)
                .setDisabled(result.doc.beta ?? false)
                .setStyle(ButtonStyle.Secondary)
    
                total.push(button)
                actionrow.addComponents(button)
            } 
            
            if (actionrows.length > 5 || total.length == results.length) {
                return interaction.reply({
                    embeds: [embed],
                    components: actionrows
                })
            }
        })
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
			filtered.map(choice => ({ name: choice.name, value: choice.fileName })),
		);
        
    }
};
