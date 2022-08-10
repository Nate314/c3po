import { Attachment, RichEmbed } from 'discord.js';
import { Embed } from './commands';

export function makeEmbed(title: RichEmbed | string, description?: string, imageurl?: string, imageName?: string, footer?: string): Embed {
    if (title['split'] === undefined) return <Embed> { embed: <RichEmbed> title };
    const richEmbed = <RichEmbed> { color: 3447003, title: title };
    if (description) richEmbed.description = description;
    if (imageurl) richEmbed.image = { url: imageurl };
    if (footer) richEmbed.footer = { text: footer };
    if (imageName) {
        // const fs = require('fs');
        // const buffer = fs.readFileSync(`./${imageName}`);
        richEmbed.files = [ imageName ];
        // richEmbed.files = [ new Attachment(buffer, imageName) ];
        // richEmbed.image = {
        //     url: `attachment://${imageName}`
        // };
    }
    richEmbed.timestamp = new Date();
    return <Embed> { embed: richEmbed };
}

export class Browser {
    private static _browser;
    private static _page;
    public static set browser(val) { this._browser = val; }
    public static get browser() { return this._browser; }
    public static set page(val) { this._page = val; }
    public static get page() { return this._page; }
}
