module.exports = {
	data: {
		name: "devtest",
		description: "Dev",
	},
	customData: {
		usage: ["/devtest"],
		dev: true,
	},
	execute(interaction, client = null) {
		interaction.reply({ content: "Yes :)", ephemeral: true });
	},
};
