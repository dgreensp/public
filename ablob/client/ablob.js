

var blobLoc = [0, 0];
var blobElem;

Meteor.startup(function () {

  blobElem = $('.block').get(0);
  moveBlob(0, 0);

  $(document).keydown(function (evt) {
    switch (evt.which) {
    case 37: // left
      moveBlob(-1,0);
      break;
    case 38: // up
      moveBlob(0,-1);
      break;
    case 39: // right
      moveBlob(1,0);
      break;
    case 40: // down
      moveBlob(0,1);
      break;
    }
  });
});

moveBlob = function (dx, dy) {
  var x = (blobLoc[0] += dx);
  var y = (blobLoc[1] += dy);

  $(blobElem).css({left: x*40 - 20,
                   top: y*40 - 20});
};
