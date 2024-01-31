# carouscroll

A web component to add next/previous buttons to a horizontal scrollable container.

## Install

```
npm install @zachleat/carouscroll --save
```

## CSS

Some critical CSS is necessary to reduce Layout Shift and set the aspect ratio of the slides.

```css
/* CSS to reduce CLS */
carou-scroll {
	display: flex;
	overflow-x: scroll;
	overflow-y: hidden;
	/* If you want the next/previous buttons to smooth scroll */
	/* scroll-behavior: smooth; */
}
carou-scroll > * {
	display: block;
	min-width: 100%;
	aspect-ratio: 16/9;
}
</style>
```