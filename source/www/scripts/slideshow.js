/**
 * author: Thierry Koblentz
 * Copyright 2011 - css-101.org
 * http://www.css-101.org/articles/ken-burns_effect/css-transition.php
 */
(function($) {
  'use strict';

  $.fn.kenBurns = function (timeout, selector) {

    if(!timeout) {
      timeout = 5000;
    }

    if(!selector) {
      selector = '> div';
    }

    var $images = $(selector, this);
    var numberOfImages = $images.length;
    var i = 0;
    var $caption = $('figure figcaption', 'main');

    console.log('numberOfImages', numberOfImages, 'i', i);

    function animateImage() {

      console.log('i', i);

      if(i === numberOfImages) {
        i = 0;
      }

      $images.eq(i).addClass('fx').delay(timeout).siblings().removeClass('fx');

      $caption.addClass('transitioning');

      setTimeout(function() {
        $caption.text($images.eq(i).attr('data-title')).removeClass('transitioning');
      }, 1750);

      i++;

      window.setTimeout(animateImage, timeout);

    }

    animateImage();

  };

})(jQuery);
