import * as requestPromise from 'request-promise';

export class HttpClient {
    public static getOptions(uri: string, body?: any) {
        let options = {
            uri: uri,
            headers: {
                "content-type": 'application/json',
            }
        };
        if (body) {
            options['body'] = body;
        }
        console.log(options);
        return options;
    }

    public static request(requestMethod, options) {
        return requestMethod(options);
    }

    public static get(uri: string) {
        return HttpClient.request(requestPromise.get, this.getOptions(uri));
    }

    public static post(uri: string, body: any) {
        return HttpClient.request(requestPromise.post, this.getOptions(uri, body));
    }

    public static put(uri: string, body: any) {
        return HttpClient.request(requestPromise.put, this.getOptions(uri, body));
    }
}

