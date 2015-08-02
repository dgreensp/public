function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function getDroppedEntries(event) {
  return toArray(event.dataTransfer.items).map(
    item => item.webkitGetAsEntry());
};

function listDirectory(dir) {
  // https://developer.mozilla.org/en-US/docs/Web/API/DirectoryReader#readEntries
  return new Promise((resolve, reject) => {
    const reader = dir.createReader();
    const allEntries = [];
    function doRead() {
      reader.readEntries((entries) => {
        if (entries.length) {
          allEntries.push(...toArray(entries));
          doRead();
        } else {
          resolve(allEntries);
        }
      }, (error) => {
        reject(error);
      });
    }
    doRead();
  });
};

function getTempFS() {
  return new Promise((resolve, reject) => {
    window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024, // 1MB
                                   resolve, reject);
  });
}

function resolveEntries(entries) {
  return Promise.all(entries.map(resolveEntry));
}

function resolveEntry(entry) {
  if (entry.isDirectory) {
    return listDirectory(entry).then((children) => {
      entry.children = children;
      return resolveEntries(children).then(() => entry);
    });
  } else if (entry.isFile) {
    return new Promise((resolve, reject) =>
                       entry.file(resolve, reject)).then((blob) => {
                         entry.blob = blob;
                         return entry;
                       });
  } else {
    // not sure if this is possible, but if so...
    return Promise.resolve(entry);
  }
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(new Uint8Array(reader.result));
    });
    reader.addEventListener('error', () => {
      reject(reader.error);
    });
    reader.readAsArrayBuffer(blob);
  });
}

function sha256(data) {
  return crypto.subtle.digest("SHA-256", data).then((buf) => {
    const bytes = new Uint8Array(buf);
    let result = '';
    for (var i = 0; i < bytes.length; i++) {
      result += ('0' + bytes[i].toString(16)).slice(-2);
    }
    return result;
  });
}

if (Meteor.isClient) {

  Meteor.startup(() => {
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('dragenter', e => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const droppedEntries = getDroppedEntries(e);

      const T = Date.now();
      resolveEntries(droppedEntries).then((entries) => {
        console.log("Resolved in", Date.now() - T, "ms");
        const T2 = Date.now();

//        readBlob(entries[0].children[9].blob).then(function (buf) {
//          debugger;
        //        });
        function countFiles(array) {
          let total = 0;
          array.forEach((entry) => {
            if (entry.isFile) {
              if (entry.name.charAt(0) !== '.') {
                total++;
              }
            } else if (entry.children) {
              total += countFiles(entry.children);
            }
          });
          return total;
        }

        console.log("Total number of files:", countFiles(entries));
        console.log("Counted in", Date.now() - T2, "ms");

        if (entries.length === 1 && entries[0].isFile) {
          const f = entries[0].blob;
          console.log(`Taking SHA-256 of ${f.size} byte file...`);
          const T3 = Date.now();
          let T4;
          readBlob(f).then((data) => {
            console.log(`Reading took ${Date.now() - T3} ms`);
            T4 = Date.now();
            return sha256(data);
          }).then((digest) => {
            console.log(digest);
            console.log(`Digest took ${Date.now() - T4} ms`);
          });
        }
      });

    });
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
