Meteor.startup(() => {
  jwplayer.key = 'r1/eYk5ESOmG/ldLK40/iYwp0DV4FX8yKu0qu7T0POdsgkl/UKGGag==';
  PLAYER = jwplayer("jwplayer");
  PLAYER.setup({
    file: 'http://dgreenspan.s3.amazonaws.com/media/Hair_Brushing_and_Relaxing_Rambling.mp4'
  });
});
