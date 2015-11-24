  "handles a falsy extraction"() {
    const bytes4 = bytes(4);
    const bytes5 = bytes(5);

    const boolExtractor = (chunks, c, offset, available) => {
      const firstFour = bytes4(chunks, c, offset, available);
      if (! firstFour) {
        return null;
      }
      const str = firstFour.toString();
      console.log(firstFour);
      if (str === 'true') {
        return true;
      } else if (str === 'fals') {
        if (available < 5) {
          return null;
        } else {
          const firstFive =
                  bytes5(chunks, c, offset, available).toString();
          console.log(firstFive);
          if (firstFive === 'false') {
            return false;
          }
        }
      }
      throw new Error("Expected true or false");
    };

    const sp = () => new StreamParser(function* () {
      return (yield boolExtractor);
    });

    expect(sp().addChunk(new Buffer('true'))).toBe(true);
    expect(sp().addChunk(new Buffer('false'))).toBe(false);
  }
