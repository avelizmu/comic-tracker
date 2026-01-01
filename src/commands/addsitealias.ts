import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';

import { db } from '../database';
import { Site } from '../database_types/site';

export const data = new SlashCommandBuilder()
    .setName('addsitealias')
    .setDescription('Adds a new alias to a site')
    .addStringOption(option => 
        option.setName('site')
            .setDescription('The site to add an alias to')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option => 
        option.setName('alias')
            .setDescription('The alias to add')
            .setRequired(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const site = interaction.options.getString('site', true);
    const alias = interaction.options.getString('alias', true);

    try {
        // Check if site is a number (passed by autocomplete) and use that as ID or look up the site by name
        let siteId: number;
        if(Number.isInteger(parseInt(site))) {
            siteId = parseInt(site);
        }
        else {
            siteId = (await db.selectFrom('site').selectAll().where('name', '=', site).executeTakeFirstOrThrow() as Site).id;
        }

        await db.insertInto('site_alias')
        .values({
            site_id: siteId,
            alias,
        })
        .execute();
    }
    catch (error) {
        console.error('Error adding alias:', error);
        await interaction.reply({ content: 'There was an error adding the alias. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ content: `Alias added: ${alias} to site: ${site}`, flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    // Search both sites and aliases
    const sites = await db.selectFrom('site').selectAll().where('name', 'like', `%${focusedValue}%`).limit(25).execute();
    const alieases = await db.selectFrom('site_alias').selectAll().where('alias', 'like', `%${focusedValue}%`).limit(25).execute();

    await interaction.respond(
        // Merge and sort results
        [...sites.map(site => ({ name: site.name, value: site.id.toString() })), ...alieases.map(alias => ({ name: alias.alias, value: alias.site_id.toString() }))].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
    );
}