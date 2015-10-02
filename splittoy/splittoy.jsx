if (Meteor.isClient) {
  Meteor.startup(function () {
    const splitty = React.render(<SplittyRoot/>, document.body);

    document.addEventListener('keydown', event => {
      const {keyCode, shiftKey, ctrlKey, metaKey, altKey} = event;
      const arrow = {
        37: 'L',
        38: 'U',
        39: 'R',
        40: 'D'
      }[keyCode];
      const anyModifiers = (shiftKey || ctrlKey || altKey || metaKey);

      if (arrow) {
        if (! anyModifiers) {
          splitty.navigate(arrow);
          event.preventDefault();
        }
      }

      if (keyCode === 90) { // Z
        if (! anyModifiers) {
          splitty.navigateOut();
          event.preventDefault();
        }
      }

      if (keyCode === 32) { // space
        if (! anyModifiers) {
          splitty.toggle();
          event.preventDefault();
        }
      }
    });
  });
}

SplittyRoot = React.createClass({
  getInitialState() {
    return {
      boardRoot: {color: 'black', U: {color: 'white'}, D: {}},
      focus: ''
    };
  },
  render() {
    const { focus, boardRoot: rect } = this.state;
    const id = '';
    return <div className="board">
      <Splitty {...{rect, focus, id}}/>
      </div>;
  },
  getRectById(id) {
    let rect = this.state.boardRoot;
    for (let i=0; i < id.length && rect; i++) {
      rect = rect[id.charAt(i)];
    }
    return rect;
  },
  navigateOut() {
    const focus = this.state.focus;
    if (focus) {
      this.setState({focus: focus.slice(0, -1)});
    }
  },
  navigate(dir) {
    const focus = this.state.focus;
    const newId = focus + dir;
    if (! this.getRectById(newId)) {
      const oldRect = this.getRectById(focus);
      const {U, D, L, R} = oldRect;
      if (!((dir === 'U' || dir === 'D') ? (L || R) : (U || D))) {
        oldRect[dir] = {}; // mutate in place
        // tell React about the mutation
        this.setState({ boardRoot: this.state.boardRoot,
                        focus: newId });
      } else {
        // disallowed
      }
    } else {
      this.setState({ focus: newId });
    }
  },
  toggle() {
    const rect = this.getRectById(this.state.focus);
    if (rect) {
      // mutate in place
      rect.color = (rect.color === 'black' ? 'white' : 'black');
      // tell React about the mutation
      this.setState({ boardRoot: this.state.boardRoot });
    }
  }
});

Splitty = React.createClass({
  propTypes: {
    rect: React.PropTypes.object.isRequired,
    where: React.PropTypes.string,
    id: React.PropTypes.string.isRequired,
    focus: React.PropTypes.string
  },
  render() {
    const where = this.props.where || '';
    const {U, D, L, R} = this.props.rect;
    const kids = {U, D, L, R};
    const {id, focus} = this.props;

    return <div className={`rect rect${where}`} style={
      {background: this.props.rect.color}
    }>
      {_.map(kids, (rect, where) => rect &&
             <Splitty {...{rect, where, id: id+where, focus, key: where}}/>)}
    { focus === id ? <div className="focusring"/> : null }
    </div>;
  }
});
