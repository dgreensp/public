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

function blobFromData(data) {
  // The ArrayBuffers used to make a Blob can't be too big, so slice up `data`.
  const slices = [];
  const sliceSize = 1000000;
  for (let sliceStart = 0; sliceStart < data.length; sliceStart += sliceSize) {
    slices.push(data.subarray(sliceStart, sliceStart + sliceSize));
  }
  return new Blob(slices);
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
//        console.log("Resolved in", Date.now() - T, "ms");
//        const T2 = Date.now();

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

//        console.log("Total number of files:", countFiles(entries));
//        console.log("Counted in", Date.now() - T2, "ms");

        if (entries.length === 1 && entries[0].isFile) {
          if (entries[0].name.slice(-4) === '.mp4') {
            // VIDEO
            const v = $("#thevideo")[0];
            if (v.src.slice(0, 5) === 'blob:') {
              URL.revokeObjectURL(v.src);
              v.src = '';
            }
            const f = entries[0].blob;
            readBlob(f).then((data) => {
              v.src = URL.createObjectURL(blobFromData(data));
            });
            //v.src = URL.createObjectURL(f);
          } else {
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
         }
      });

    });

    const FRAME_RATE = 25;
    function snapToFrame(t) {
      return Math.round(t*FRAME_RATE)/FRAME_RATE;
    }

    document.addEventListener('keydown', (e) => {
      function getIncrement() {
        if (e.shiftKey && e.altKey) return 60;
        else if (e.shiftKey) return 15;
        else if (e.altKey) return 1./FRAME_RATE;
        else return 5;
      }
      const key = e.keyCode;
      const V = $("#thevideo")[0];
      if (key === 37) { // LEFT
        V.currentTime = snapToFrame(V.currentTime - getIncrement());
      } else if (key === 39) { // RIGHT
        V.currentTime = snapToFrame(V.currentTime + getIncrement());
      } else if (key === 32) { // SPACE
        if (V.paused) V.play();
        else V.pause();
      } else if (key === 65) { // A
        V.playbackRate *= 0.5;
      } else if (key === 83) { // S
        V.playbackRate = 1;
      } else if (key === 68) { // D
        V.playbackRate *= 2;
      } else if (key === 70) { // F
        if (document.webkitFullscreenElement) {
          V.webkitExitFullscreen();
        } else {
          V.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      } else {
        return;
      }
      e.preventDefault();
    });
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
