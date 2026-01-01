import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { db } from '../database';

export const data = new SlashCommandBuilder()
    .setName('addsite')
    .setDescription('Adds a new site to the tracker')
    .addStringOption(option => 
        option.setName('name')
            .setDescription('The name of the site to add')
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName('url')
            .setDescription('The URL of the site to add')
            .setRequired(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const name = interaction.options.getString('name', true);
    const url = interaction.options.getString('url', true);

    try {
        await db.insertInto('site')
        .values({
            name,
            url,
        })
        .execute();
    }
    catch (error) {
        console.error('Error adding site:', error);
        await interaction.reply({ content: 'There was an error adding the site. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ content: `Site added: ${name} (${url})`, flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds });
}