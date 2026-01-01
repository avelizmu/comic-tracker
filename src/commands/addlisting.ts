import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';

import { db } from '../database';

export const data = new SlashCommandBuilder()
    .setName('addlisting')
    .setDescription('Adds a new listing to the tracker')
    .addStringOption(option => 
        option.setName('comic')
            .setDescription('The name of the comic for the listing')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName('site')
            .setDescription('The site of the listing')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName('url')
            .setDescription('The URL of the listing')
            .setRequired(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const comic = interaction.options.getString('comic', true);
    const site = interaction.options.getString('site', true);
    const url = interaction.options.getString('url', true);

    try {
        // Check if site is a number (passed by autocomplete) and use that as ID or look up the site by name
        let siteId: number;
        if(Number.isInteger(parseInt(site))) {
            siteId = parseInt(site);
        }
        else {
            siteId = (await db.selectFrom('site').selectAll().where('name', '=', site).executeTakeFirstOrThrow()).id;
        }

        // Check if comic is a number (passed by autocomplete) and use that as ID or look up the comic by name
        let comicId: number;
        if(Number.isInteger(parseInt(comic))) {
            comicId = parseInt(comic);
        }
        else {
            comicId = (await db.selectFrom('comic').selectAll().where('name', '=', comic).executeTakeFirstOrThrow()).id;
        }


        await db.insertInto('comic_listing')
        .values({
            comic_id: comicId,
            site_id: siteId,
            url,
            latest_chapter: "0",
            last_updated: "1970-01-01T00:00:00.000Z",
        })
        .execute();

        await interaction.reply({ content: `Listing added`, flags: MessageFlags.Ephemeral });
    }
    catch (error) {
        console.error('Error adding comic:', error);
        await interaction.reply({ content: 'There was an error adding the comic. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }

}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused(true);

    // Handle autocomplete for both site and comic options
    if(focusedValue.name === 'site') {
        // Search both sites and aliases
        const sites = await db.selectFrom('site').selectAll().where('name', 'like', `%${focusedValue.value}%`).limit(25).execute();
        const aliases = await db.selectFrom('site_alias').selectAll().where('alias', 'like', `%${focusedValue.value}%`).limit(25).execute();

        await interaction.respond(
            // Merge and sort results
            [...sites.map(site => ({ name: site.name, value: site.id.toString() })), ...aliases.map(alias => ({ name: alias.alias, value: alias.site_id.toString() }))].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
        );
        return;
    }
    if(focusedValue.name === 'comic') {
        // Search both comics and aliases
        const comics = await db.selectFrom('comic').selectAll().where('name', 'like', `%${focusedValue.value}%`).limit(25).execute();
        const aliases = await db.selectFrom('comic_alias').selectAll().where('alias', 'like', `%${focusedValue.value}%`).limit(25).execute();

        await interaction.respond(
            // Merge and sort results
            [...comics.map(comic => ({ name: comic.name, value: comic.id.toString() })), ...aliases.map(alias => ({ name: alias.alias, value: alias.comic_id.toString() }))].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
        );
        return;
    }
}