# carouscroll

A web component to add next/previous buttons to a horizontal scrollable container.

* [Demos](https://zachleat.github.io/carouscroll/demo.html)

## Installation

You can install via `npm` or download the `carouscroll.js` JavaScript file manually.

```shell
npm install @zachleat/carouscroll --save
```

Add `carouscroll.js` to your site’s JavaScript assets.

## Usage

First you need to add some critical CSS to your page. These styles are **crucial** to reduce Layout Shift (CLS), set the aspect ratio of the slides, and avoid loading `loading="lazy"` images on off-screen slides.

```css
carou-scroll {
	display: flex;
	overflow-x: scroll;
	overflow-y: hidden;
}
carou-scroll > * {
	display: block;
	min-width: 100%;
	aspect-ratio: 16/9;
}
```

Next, add the HTML:

```html
<carou-scroll id="my-scroller">
	<div class="demo-slide">1</div>
	<div class="demo-slide">2</div>
	<!-- … -->
</carou-scroll>
```

That’s it!

### Add buttons (optional)

```html
<button type="button" disabled data-carousel-previous="my-scroller">Previous</button>
<button type="button" disabled data-carousel-next="my-scroller">Next</button>
```

### Add output (optional)

This will update (and accessibly announce) a current status element with e.g. `Slide 1 of 10` text.

```html
<output data-carousel-output="my-scroller"></output>
```

### Make it loop around (optional)

Add the `loop` attribute.

```html
<carou-scroll id="my-scroller" loop>
```

### Smooth scrolling CSS (optional)

```css
carou-scroll {
	scroll-behavior: smooth;
}
```
