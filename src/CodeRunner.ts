import { CommandParam, Embed } from './commands';
import { logFailure } from './Utility';

const get_code = (val: string, langs: string[]): string => {
    if (!!val && val.substr(0, 3) === '```' && val.substr(val.length - 3, 3) === '```') {
        let result = val.substr(3, val.length - 6).trim();
        langs.forEach(prefix => {
            if (result.startsWith(prefix)) {
                result = result.substr(prefix.length).trim();
            }
        });
        return result;
    } else {
        return val;
    }
};

const get_title = (title: string): string => {
    if (title.length > 255) {
        const elipses = ' . . .';
        const candidate = `${title}\n`.split('\n')[0] + elipses;
        if (candidate.length < 255) {
            return candidate;
        } else {
            return title.substr(0, 255 - elipses.length) + elipses;
        }
    } else {
        return title;
    }
};

export const executeCode = async (cp: CommandParam, queryURL: string, codeval: string, langs: string[]): Promise<Embed | string> => {
    const code = get_code(codeval, langs);
    return fetch(queryURL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code }),
    }).then(x => x.ok ? x.text() : Promise.reject(new Error(`${x.status} ${x.statusText}`))).then(response => {
        cp.message.channel.send({
            embeds: [{
                color: 3447003,
                title: get_title(code),
                description: response
            }]
        }).catch(logFailure('send code result'));
        return '';
    });
};
