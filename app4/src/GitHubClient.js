import request from "request-promise";

export default class GitHubClient {
  constructor({accessToken, userAgent}) {
    this.accessToken = accessToken;
    this.userAgent = userAgent;

    if (! this.accessToken) throw new Error('accessToken required');
    if (! this.userAgent) throw new Error('userAgent required');
  }

  getRaw(path) {
    if (path.charAt(0) !== '/') {
      throw new Error("path must be a string starting with '/'");
    }

    return request({
      uri: 'https://api.github.com' + path,
      qs: {
        access_token: this.accessToken
      },
      json: true,
      headers: {
        'User-Agent': this.userAgent
      },
      resolveWithFullResponse: true
    }).catch(error => ({error})).then(response => ({response}));
  }
}
