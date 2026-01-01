import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder, AutocompleteInteraction, ContainerBuilder, TextChannel, ButtonInteraction, messageLink, SectionComponent, ContainerComponent, ButtonComponent, ComponentType, TextDisplayComponent } from 'discord.js';

import { db } from '../database';

export const data = new SlashCommandBuilder()
    .setName('getcomic')
    .setDescription('Retrieves a comic from the tracker')
    .addStringOption(option => 
        option.setName('name')
            .setDescription('The name of the comic to retrieve')
            .setRequired(true)
            .setAutocomplete(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const name = interaction.options.getString('name', true);

    await interaction.deferReply({ ephemeral: true });

    try {
        // Check if name is a number (passed by autocomplete) and use that as ID or look up the comic by name
        let comicId: number;
        if(Number.isInteger(parseInt(name))) {
            comicId = parseInt(name);
        }
        else {
            comicId = (await db.selectFrom('comic').selectAll().where('name', '=', name).executeTakeFirstOrThrow()).id;
        }

        if(!comicId) {
            await interaction.editReply({ content: 'Comic not found.' });
            return;
        }

        const comic = await db.selectFrom('comic').selectAll().where('id', '=', comicId).executeTakeFirstOrThrow();

        const comicAliases = await db.selectFrom('comic_alias').selectAll().where('comic_id', '=', comicId).execute();
        const aliases = comicAliases.map(alias => alias.alias).join(', ');
        const combinedListings: {site: string, listingId: number, latestChapter: string}[] = [];

        // Create a list for each listing with the site name, listing id, and latest chapter
        const comicListings = await db.selectFrom('comic_listing').selectAll().where('comic_id', '=', comicId).execute();
        for(const listing of comicListings) {
            // Add listing info to embed
            const site = await db.selectFrom('site').selectAll().where('id', '=', listing.site_id).executeTakeFirst();
            combinedListings.push({ site: site?.name || 'Unknown Site', listingId: listing.id, latestChapter: listing.latest_chapter });
        }

        const container = new ContainerBuilder()
        .addTextDisplayComponents((textDisplay) => {
            textDisplay.setContent(`${comic.name}\nAliases: ${aliases || 'None'}\nListings:`);
            return textDisplay;
        });
        
        // For each listing, add a section with a subscribe/unsubscribe button
        for(const listing of combinedListings) {
            const subscription = await db.selectFrom('comic_subscription').selectAll().where('comic_listing_id', '=', listing.listingId).where('discord_user_id', '=', interaction.user.id).executeTakeFirst();

            container.addSectionComponents((section) => {
                section.addTextDisplayComponents((textDisplay) => {
                    textDisplay.setContent(`${listing.site}\nLatest Chapter: ${listing.latestChapter}`);
                    return textDisplay;
                });
                section.setButtonAccessory((button => {
                    if(subscription) {
                        button.setLabel('Unsubscribe');
                        button.setStyle(2); // Secondary style
                        button.setCustomId(`getcomic_unsubscribe_${subscription.id}`);
                        return button;
                    }
                    else {
                        button.setLabel('Subscribe');
                        button.setStyle(1); // Primary style
                        button.setCustomId(`getcomic_subscribe_${listing.listingId}`);
                        return button;
                    }
                }));
                return section;
            });
        }

        await interaction.editReply({ components: [container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
    }
    catch (error) {
        console.error('Error retrieving comics:', error);
        await interaction.reply({ content: 'There was an error retrieving the comics. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    // Search both comics and aliases
    const comics = await db.selectFrom('comic').selectAll().where('name', 'like', `%${focusedValue}%`).limit(25).execute();
    const aliases = await db.selectFrom('comic_alias').selectAll().where('alias', 'like', `%${focusedValue}%`).limit(25).execute();

    await interaction.respond(
        // Merge and sort results
        [...comics.map(comic => ({ name: comic.name, value: comic.id.toString() })), ...aliases.map(alias => ({ name: alias.alias, value: alias.comic_id.toString() }))].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
    );
}

export async function buttonExecute(interaction: ButtonInteraction) {
    // Parse action and id from customId (format getcomic_{action}_{id})
    const [action, id] = interaction.customId.split('_').slice(1);

    try {
        if(action === 'subscribe') {
            // Check if already subscribed
            const existingSubscription = await db.selectFrom('comic_subscription').selectAll().where('comic_listing_id', '=', parseInt(id)).where('discord_user_id', '=', interaction.user.id).executeTakeFirst();
            if(existingSubscription) {
                await interaction.reply({ content: 'You are already subscribed to this comic.', flags: MessageFlags.Ephemeral });
                return;
            }

            const subscription = await db.insertInto('comic_subscription')
            .values({
                comic_listing_id: parseInt(id),
                last_read_chapter: '0',
                discord_user_id: interaction.user.id,
            })
            .execute();

            let containerBuilder = new ContainerBuilder();

            // Recreate the message components with updated button for "Unsubscribe"
            interaction.message.components.forEach((container) => {
                (container as ContainerComponent).components.forEach((section) => {
                    if(section.type == ComponentType.TextDisplay) {
                        containerBuilder.addTextDisplayComponents((textDisplay) => {
                            textDisplay.setContent((section as TextDisplayComponent).content || '');
                            return textDisplay;
                        });
                        return;
                    }
                    const button = ((section as SectionComponent).accessory as ButtonComponent);
                    if(button.customId === interaction.customId) {
                        containerBuilder.addSectionComponents((newSection) => {
                            newSection.addTextDisplayComponents((textDisplay) => {
                                textDisplay.setContent((section as SectionComponent).components[0].data.content || '');
                                return textDisplay;
                            });
                            newSection.setButtonAccessory((button => {
                                button.setLabel('Unsubscribe');
                                button.setStyle(2);
                                button.setCustomId(`getcomic_unsubscribe_${subscription[0].insertId}`);
                                return button;
                            }));
                            return newSection;
                        });
                    }
                    else {
                        containerBuilder.addSectionComponents((newSection) => {
                            newSection.addTextDisplayComponents((textDisplay) => {
                                textDisplay.setContent((section as SectionComponent).components[0].data.content || '');
                                return textDisplay;
                            });
                            newSection.setButtonAccessory((button => {
                                button.setLabel(((section as SectionComponent).accessory as ButtonComponent).label || '');
                                button.setStyle(((section as SectionComponent).accessory as ButtonComponent).style || 2);
                                button.setCustomId(((section as SectionComponent).accessory as ButtonComponent).customId || '');
                                return button;
                            }));
                            return newSection;
                        });
                    }
                });
            });           

            await interaction.update({ components: [containerBuilder], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        }
        else if(action === 'unsubscribe') {
            // Check if subscription exists
            const subscription = await db.selectFrom('comic_subscription').selectAll().where('id', '=', parseInt(id)).where('discord_user_id', '=', interaction.user.id).executeTakeFirst();
            if(!subscription) {
                await interaction.reply({ content: 'Subscription not found.', flags: MessageFlags.Ephemeral });
                return;
            }

            await db.deleteFrom('comic_subscription')
            .where('id', '=', parseInt(id))
            .execute();

            let containerBuilder = new ContainerBuilder();

            // Recreate the message components with updated button for "Subscribe"
            interaction.message.components.forEach((container) => {
                (container as ContainerComponent).components.forEach((section) => {
                    if(section.type == ComponentType.TextDisplay) {
                        containerBuilder.addTextDisplayComponents((textDisplay) => {
                            textDisplay.setContent((section as TextDisplayComponent).content || '');
                            return textDisplay;
                        });
                        return;
                    }
                    const button = ((section as SectionComponent).accessory as ButtonComponent);
                    if(button.customId === interaction.customId) {
                        containerBuilder.addSectionComponents((newSection) => {
                            newSection.addTextDisplayComponents((textDisplay) => {
                                textDisplay.setContent((section as SectionComponent).components[0].data.content || '');
                                return textDisplay;
                            });
                            newSection.setButtonAccessory((button => {
                                button.setLabel('Subscribe');
                                button.setStyle(1);
                                button.setCustomId(`getcomic_subscribe_${subscription.comic_listing_id}`);
                                return button;
                            }));
                            return newSection;
                        });
                    }
                    else {
                        containerBuilder.addSectionComponents((newSection) => {
                            newSection.addTextDisplayComponents((textDisplay) => {
                                textDisplay.setContent((section as SectionComponent).components[0].data.content || '');
                                return textDisplay;
                            });
                            newSection.setButtonAccessory((button => {
                                button.setLabel(((section as SectionComponent).accessory as ButtonComponent).label || '');
                                button.setStyle(((section as SectionComponent).accessory as ButtonComponent).style || 2);
                                button.setCustomId(((section as SectionComponent).accessory as ButtonComponent).customId || '');
                                return button;
                            }));
                            return newSection;
                        });
                    }
                });
            });       

            await interaction.update({ components: [containerBuilder], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        }
        else {
            await interaction.reply({ content: 'Unknown action.' });
        }
    }
    catch (error) {
        console.error('Error processing button interaction:', error);
        await interaction.reply({ content: 'There was an error processing your request. Please try again later.', flags: MessageFlags.Ephemeral });
    }
}