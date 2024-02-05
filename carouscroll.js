class Carouscroll extends HTMLElement {
	static tagName = "carou-scroll";

	static register(tagName, registry) {
		if(!registry && ("customElements" in globalThis)) {
			registry = globalThis.customElements;
		}

		registry?.define(tagName || this.tagName, this);
	}

	static attr = {
		orientation: "orientation",
		disabled: "disabled",
		prev: "data-carousel-previous",
		next: "data-carousel-next",
		output: "data-carousel-output",
		outputCurrent: "data-carousel-output-current",
		outputTotal: "data-carousel-output-total",
	};

	static classes = {
	};

	static css = `
:host {
	display: flex;
	overflow-x: scroll;
	overflow-y: hidden;
	scroll-snap-type: x mandatory;
}
::slotted(*) {
	display: block;
	min-width: 100%;
	scroll-snap-align: center;
}
`;

	connectedCallback() {
		// https://caniuse.com/mdn-api_cssstylesheet_replacesync
		if(this.shadowRoot || !("replaceSync" in CSSStyleSheet.prototype) || this.hasAttribute(Carouscroll.attr.disabled)) {
			return;
		}

		let shadowroot = this.attachShadow({ mode: "open" });
		let sheet = new CSSStyleSheet();
		sheet.replaceSync(Carouscroll.css);
		shadowroot.adoptedStyleSheets = [sheet];

		let slot = document.createElement("slot");
		shadowroot.appendChild(slot);

		this.content = this;
		this.content.setAttribute("tabindex", "0");
		this.slides = this.content.children;

		this.initializeButtons();
		this.initializeOutput();

		let activePage = this.findActivePage();
		this.renderMetadata(activePage);

		/* Manual scrolling */
		/* Note: `scrollend` missing on Safari */
		this.content.addEventListener("scrollend", () => {
			this.renderMetadata(this.findActivePage());
		});
		// Manual touch scroll
		this.content.addEventListener("touchend", () => {
			this.renderMetadata(this.findActivePage());
		})
	}

	get id() {
		return this.getAttribute("id");
	}

	initializeButtons() {
		this.nextButton = document.querySelector(`[${Carouscroll.attr.next}="${this.id}"]`);
		this.prevButton = document.querySelector(`[${Carouscroll.attr.prev}="${this.id}"]`);

		this.prevButton?.addEventListener("click", e => {
			this._buttonClick("previous");
			e.preventDefault();
		}, false);

		this.nextButton?.addEventListener("click", e => {
			this._buttonClick("next");
			e.preventDefault();
		}, false);
	}

	initializeOutput() {
		let output = document.querySelector(`[${Carouscroll.attr.output}="${this.id}"]`);
		if(!output) {
			return;
		}

		this.output = output;

		if(output.childElementCount === 0) {
			output.innerHTML = `<span ${Carouscroll.attr.outputCurrent}></span> of <span ${Carouscroll.attr.outputTotal}></span>`;
		}

		this.outputCurrent = output.querySelector(`[${Carouscroll.attr.outputCurrent}]`);
		this.outputTotal = output.querySelector(`[${Carouscroll.attr.outputTotal}]`);

		// https://www.w3.org/WAI/tutorials/carousels/functionality/
		output.setAttribute("aria-live", "polite");
		output.setAttribute("aria-atomic", "true");
	}

	renderOutput(activePage) {
		if(!this.outputCurrent || !this.outputTotal) {
			return;
		}

		this.outputCurrent.innerText = this.findIndexForPage(activePage);
		this.outputTotal.innerText = this.content.children.length;
	}

	findIndexForPage(page) {
		let j = 0;
		for(let child of this.content.children) {
			j++;

			if(page === child) {
				return j;
			}
		}
		return -1;
	}

	findActivePage() {
		let activePage;
		let scrollPosition = this.content.scrollLeft;

		for(let child of this.content.children) {
			activePage = child;

			// start of active page must be before center of window
			// end of active page must be after center of window
			let start = child.offsetLeft;
			let end = start + child.offsetWidth;

			let scrollMidpoint = scrollPosition + this.content.offsetLeft + this.content.offsetWidth / 2;

			if(start <= scrollMidpoint && end >= scrollMidpoint) {
				break;
			}
		}

		return activePage;
	}

	isLooping() {
		return this.hasAttribute("loop");
	}

	renderMetadata(page) {
		this.renderOutput(page);
		this.disablePrevNextButtons(page);
	}

	disablePrevNextButtons(moveToPage) {
		if(!this.nextButton || !this.prevButton) return;

		if(this.isLooping()) {
			this.prevButton.removeAttribute("disabled");
			this.nextButton.removeAttribute("disabled");
			return;
		}

		if(!moveToPage.nextElementSibling) {
			this.nextButton.setAttribute("disabled", "");
		} else {
			this.nextButton.removeAttribute("disabled");
		}

		if(!moveToPage.previousElementSibling) {
			this.prevButton.setAttribute("disabled", "");
		} else {
			this.prevButton.removeAttribute("disabled");
		}
	}

	_goToSlide(index) {
		const slideOffsetLeft = this.slides[index].offsetLeft;

		// In case the carousel is used in a grid system and isn’t full width,
		// we need the carousel position to not over scroll the slide.
		const carouselOffsetLeft = this.content.offsetLeft;

		this.content.scrollLeft = slideOffsetLeft - carouselOffsetLeft;
		this.renderMetadata(this.slides[index]);
	}

	_buttonClick(direction) {
		let activePage = this.findActivePage();

		// TODO implement minScrollThreshold (of half the viewport width?)
		if(activePage) {
			let isLoop = this.isLooping();
			let moveToPage = activePage[ `${direction}ElementSibling` ];

			// Loop the carousel around
			if(!moveToPage && isLoop) {
				if(isLoop) {
					if(direction === "next") {
						// loop to the beginning
						this.content.scrollLeft = 0;
					} else {
						this.content.scrollLeft = this.content.lastElementChild.offsetLeft;
					}
				}
			} else if(moveToPage) {
				// Stop at the end
				let newScrollPosition = moveToPage.offsetLeft + moveToPage.offsetWidth / 2 - document.body.clientWidth / 2;
				this.content.scrollLeft = newScrollPosition;

				this.renderMetadata(moveToPage);
			}
		}
	}
}

Carouscroll.register();

export { Carouscroll }