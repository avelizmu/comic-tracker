import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { db } from '../database';

export const data = new SlashCommandBuilder()
    .setName('addcomic')
    .setDescription('Adds a new comic to the tracker')
    .addStringOption(option => 
        option.setName('name')
            .setDescription('The name of the comic to add')
            .setRequired(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const name = interaction.options.getString('name', true);

    try {
        await db.insertInto('comic')
        .values({
            name
        })
        .execute();
    }
    catch (error) {
        console.error('Error adding comic:', error);
        await interaction.reply({ content: 'There was an error adding the comic. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ content: `Comic added: ${name}`, flags: MessageFlags.Ephemeral });
}