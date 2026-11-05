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
 	overscroll-behavior-x: contain;
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

	// Slide position within the scrollable content, independent of where the carousel sits on the page.
	getSlideStart(slide) {
		return slide.getBoundingClientRect().left - this.content.getBoundingClientRect().left - this.content.clientLeft + this.content.scrollLeft;
	}

	findActivePage() {
		let activePage;
		let scrollMidpoint = this.content.scrollLeft + this.content.clientWidth / 2;

		for(let child of this.content.children) {
			activePage = child;

			let start = this.getSlideStart(child);
			let end = start + child.offsetWidth;

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
		this.content.scrollLeft = this.getSlideStart(this.slides[index]);
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
						this.content.scrollLeft = this.getSlideStart(this.content.lastElementChild);
					}
				}
			} else if(moveToPage) {
				// Stop at the end
				this.content.scrollLeft = this.getSlideStart(moveToPage) + moveToPage.offsetWidth / 2 - this.content.clientWidth / 2;

				this.renderMetadata(moveToPage);
			}
		}
	}
}

Carouscroll.register();

export { Carouscroll }
