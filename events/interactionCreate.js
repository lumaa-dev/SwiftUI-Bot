const { Client, InteractionType } = require("discord.js");
const { Doc } = require("../apple");
const { ownerId } = require("../functions/config.json");
const { cache } = require("../main");

module.exports = {
    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     * @param {Client?} client 
     */
    async execute(interaction, client = null) {
        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId === "editDoc") {
                const instant = interaction.member.user.id == ownerId;
                const newDescription = interaction.fields.getTextInputValue("edition")
                /**@type {Doc} */
                const objectDoc = interaction.guild.editModal;
                var proposal = newDescription.trim();

                await interaction.deferReply({ ephemeral: true })
                let doc = new Doc().init(objectDoc.doc.name, proposal, objectDoc.doc.beta)
                if (instant) {
                    cache.add(doc)
                } else {
                    return await interaction.editReply({ content: "You cannot modify docs", ephemeral: true })
                }
                
                await interaction.editReply({ content: instant ? `Modified \`${objectDoc.doc.fileName}.json\`` : `Your modification request of the **${objectDoc.doc.name}** has been sent` })
            }
        }
    }
}