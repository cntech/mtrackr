# MTrackr

Video-like but video-less tours on your website

## Install

`bower install https://github.com/cntech/mtrackr.git`

## Example usage

```javascript
mtrackr = require('mtrackr/dist/js/mtrackr.js')
mtrackr.setup({
  buttonTemplate: '/views/mtrackr/mtrackr.html'
})
```

```javascript
var steps = [{
  element: 'nav.mainmenu a[href$="/personal"]' }, { // click on link
  element: 'nav.submenu a[href$="/personal/about"]' }, {
  element: 'nav.submenu a[href$="/personal/skills"]' }, {
  element: 'nav.mainmenu a[href$="/contact"]' }, {
  element: 'nav.mainmenu a[href$="/projects"]' }, {
  element: 'nav.submenu a[href$="/projects/mtrackr"]'
}]
mtrackr.after('span.website-tour', steps, {
  buttonTemplate: '/views/mtrackr/mtrackr.tour.html',
  stepDelay: 5000
})
```

The MTrackr mouse is appended to the `span` of class `website-tour`.

This example uses a custom button template */views/mtrackr/mtrackr.tour.html*:

```html
<button type="button" class="uk-button uk-button-primary mtrackr-clickforme-button">
  Start the Tour
  <img src="/bower_components/mtrackr/dist/images/link-mouse.png" class="mtrackr-dropdown-button">
</button>
```

Please make sure the image source path is correct.

Finally, place the following line in your website's main HTML file:

```html
<div class="mtrackr-virtual-mouse-pointer"></div>
```

And make sure you include all necessary styles.


## Please note

If a targeted element does not possess the `href` attribute, MTrackr assumes it has a click handler and clicks it instead of following a URL.
