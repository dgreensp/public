Tracker.Observable = class TrackerObservable {
  constructor(initialValue) {
    this._value = initialValue;
    this._observers = {};
  }

  set(newValue) {
    this._value = newValue;
    for (let id in this._observers) {
      this._observers[id].notify();
    }
  }

  get() {
    if (Tracker.currentObserver) {
      this._observers[Tracker.currentObserver.id] =
        Tracker.currentObserver;
      Tracker.currentObserver.addObservable(this);
    }
    return this._value;
  }

  subscribe(/**/) {
    // ...
  }
};

Tracker.Observer = class TrackerObserver {
  constructor(onNotify) {
    this.id = Tracker.Observer._nextId++;
    this.observables = [];
    this.onNotify = onNotify;
    this.busy = false;
  }

  addObservable(o) {
    this.observables.push(o);
  }

  notify() {
    if (! this.busy) {
      this._unlink();
      const onNotify = this.onNotify;
      if (onNotify) {
        onNotify();
      }
    }
  }

  dispose() {
    this._unlink();
  }

  _unlink() {
    this.observables.forEach(o => {
      delete o._observers[this.id];
    });
    this.observables.length = 0;
  }

  runAndNotify(func) {
    const save = Tracker.currentObserver;
    Tracker.currentObserver = this;
    this.busy = true;
    try {
      return func();
    } finally {
      this.busy = false;
      Tracker.currentObserver = save;
    }
  }
};
Tracker.Observer._nextId = 1;

Tracker.observe = function (func) {
  const observer = new Tracker.Observer(() => {
    observable.set(observer.runAndNotify(func));
  });
  const observable = new Tracker.Observable(observer.runAndNotify(func));
  return observable;
};

Tracker.currentObserver = null;
