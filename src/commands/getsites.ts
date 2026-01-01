import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';

import { db } from '../database';

export const data = new SlashCommandBuilder()
    .setName('getsites')
    .setDescription('Retrieves all sites from the tracker');
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    try {
        const sites = await db.selectFrom('site').selectAll().execute();
        const siteAliases = await db.selectFrom('site_alias').selectAll().execute();

        // Build embed for each site with its aliases
        const siteList = sites.map(site => {
            const aliases = siteAliases.filter(alias => alias.site_id === site.id).map(alias => alias.alias).join(', ');
            return new EmbedBuilder().setTitle(site.name).addFields({ name: 'URL', value: site.url }, { name: 'Aliases', value: aliases || 'None' });
        });
        if(siteList.length === 0) {
            interaction.reply({ content: 'No sites found.', flags: MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ embeds: siteList, flags: MessageFlags.Ephemeral });
        }
    }
    catch (error) {
        console.error('Error retrieving sites:', error);
        await interaction.reply({ content: 'There was an error retrieving the sites. Please try again later.', flags: MessageFlags.Ephemeral });
    }
}