var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
var orientation = 'landscape';
var ticking = false;

function handleOrientationChange() {

  if(Math.abs(window.orientation === 90) || Math.abs(window.orientation === -90) || $(window).width() >= $(window).height()) {
    ga('send', 'event', 'orientation', 'change', 'Device set to portrait orientation');
    orientation = 'landscape';
    $('html').addClass('landscape').removeClass('portrait');
  } else {
    ga('send', 'event', 'orientation', 'change', 'Device set to landscape orientation');
    orientation = 'portrait';
    $('html').addClass('portrait').removeClass('landscape');
  }

}

function handlePageScroll(selector) {
  var $selector = $(selector);
  $('html, body').animate(
    {
      scrollTop: $selector.offset().top
    },
    1500
  );
}

function handleKeydownEvent(event) {
  console.log('keydown in handleKeydownEvent', event.keyCode);
  switch(event.keyCode) {
    case 38:
      handlePageScroll('main');
      event.preventDefault();
    break;
    case 40:
      handlePageScroll('article');
      event.preventDefault();
    break;
  }
}

function handleScrollEvent(event) {
  console.log('scroll in handleScrollEvent', event.originalEvent);
  if(event.originalEvent.wheelDeltaY >= 3) {
    handlePageScroll('main');
  } else if (event.originalEvent.wheelDeltaY <= -3){
    handlePageScroll('article');
  }
}

function handleScrollEventCheck(event) {
  // console.log('changeSlideCheck fired', ticking);
  if(!ticking) {
    handleScrollEvent(event);
    setTimeout(function () {
      ticking = false;
    }, 500);
  }
  ticking = true;

  event.preventDefault();
}

function setInteractionType() {
  if(isTouch) {
     $('html').addClass('touch');
  } else {
     $('html').addClass('no-touch');
  }
}

function initialise() {
  setInteractionType();
  handleOrientationChange();
  $(document).on('keydown.handlePageScroll', handleKeydownEvent);
  // $(document).on('wheel.handlePageScrotrall mousewheel.handlePageScroll', handleScrollEventCheck);
}

$(document).ready(function() {
  initialise();

  $(window).on('resize orientationchange', function () {
    handleOrientationChange();
  });

  $('.backgrounds').kenBurns(10000);
});
