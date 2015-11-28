import request from "request-promise";

export function getDiscovery() {
  return request({
    uri: 'https://github.com/meteor/meteor.git/info/refs?service=git-upload-pack',
    encoding: null // return a Buffer
  });
}

const SHAS = {
  meteor: '9740c232c1b0c4a6358651bc632a21e48769136d',
  public: 'bc608b88b693cecf8d82d61eea7b421d7cca289c'
};

export function getPack() {
  const nocap = `0032want ${SHAS.meteor}
0032want ${SHAS.meteor}
00000009done
`;
  const allcap = `007fwant ${SHAS.meteor} multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/1.9.2
0032want ${SHAS.meteor}
00000009done
`;
  const somecap = `0071want ${SHAS.meteor} multi_ack_detailed no-done thin-pack ofs-delta agent=git/1.9.2
0032want ${SHAS.meteor}
00000009done
`;
  return request({
    uri: 'https://github.com/meteor/meteor.git/git-upload-pack',
    method: 'POST',
    body: somecap,
    headers: {
      'Content-Type': 'application/x-git-upload-pack-request',
      'Accept': 'application/x-git-upload-pack-result'
    },
    'User-Agent': 'dgreensp GitScope',
    encoding: null
  });
}
