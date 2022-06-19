/**
 * @file Implements Navigation Bar
 * @author Stephen Matheis
 */

// Fetch and await JSON document
const requestData = await fetch('./navigation.json');

// Await return of object parsed from JSON document
const data = await requestData.json();

// Destructure cities (object[]) property
const { cities } = data;

// For each city in cities, append a <div> to <nav>.
// NOTE: 
// <nav> elements typically contain links in the form of <a> tags, 
// as this is the semantic meaning of the nav element. But they don't have to.
// Because the required animation wouldn't work with page refreshes,
// we'll use <div> tags instead. We could also use <button> or <span>.
// To accommodate. screen readers, we'll add the aria-role='button' attribute
// to each child <div> in <nav>.
// 
// (W3C <nav> spec)[https://html.spec.whatwg.org/multipage/sections.html#the-nav-element]
// (ARIA: Roles)[https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques]
//
// NOTE: HTML is not sanizited before being inserted into the DOM.
document
    .querySelector('nav')
    .insertAdjacentHTML(
        'beforeend',
        cities
            .map(({ section, label }) => {
                return /*html*/ `
                    <div class='city' data-section='${section}' aria-role='button'>${label}</div>
                `
            })
            .join('\n')
    );

// Now that all DOM nodes have been inserted, show body
document.body.style.display = 'flex';

// Get references to the slider and all city elements
const slider = document.querySelector('#slider');
const btns = document.querySelectorAll('nav .city');

// Store selected city
let selectedSection;
let selectedBtn;

// For each city btn in btns, add a click event listener.
btns.forEach(btn => {
    btn.addEventListener('click', async event => {
        // Deselect previous choice
        document.querySelector(`nav .city[data-section='${selectedSection}']`)?.classList.remove('selected')

        // Select this btn
        btn.classList.add('selected');

        // Set selection
        selectedSection = event.target.dataset.section;
        selectedBtn = btn;

        // Set slider
        setSliderSizeAndPosition();
        setTime();
    });
});

// Store reference to add transition setTimeout
let addTransition;

// Reposition slider on resize window
window.addEventListener('resize', event => {
    if (!selectedBtn) {
        return;
    }

    // Clear addTransition so it only fires once
    // (i.e. after the user has finished resizing the window)
    clearTimeout(addTransition);

    // Remove transition while resizing
    slider.classList.remove('transition');

    // Set slider
    setSliderSizeAndPosition();

    // Add transition back
    addTransition = setTimeout(() => {
        console.log('fired');

        slider.classList.add('transition');
    }, 200);
});


/**
 * Set slider size and position based on:
 * - viewport width
 * - selected city width or height
 * - selected city left or top value
 */
function setSliderSizeAndPosition() {
    // Get position values of selected city
    const { width, height, top, left} = selectedBtn.getBoundingClientRect();

    // Get body padding in pixels
    const bodyPaddingOffset = parseInt(getComputedStyle(document.body).padding.replace('px', '')) || 0;

    // Resize slider size and position to mirror nav link on click
    if (window.innerWidth > 700) {
        // Update left and width
        slider.style.left = `${left - bodyPaddingOffset}px`;
        slider.style.width = `${width}px`;

        // Reset top and height
        slider.style.top = '0px';
        slider.style.height = '1px';
    } else {
        // Update top and height
        slider.style.top = `${top - bodyPaddingOffset}px`;
        slider.style.height = `${height}px`;

        // Reset left and width
        slider.style.left = '0px'
        slider.style.width = `1px`;
    }
}

let updateTime;

/**
 * Set time and time zone <div> tags.
 */
async function setTime() {
    // Clear previous selection's updateTime
    clearInterval(updateTime);

    // Remove opacity value of 0 (opaque) from <div id='timezone'>
    document.querySelector('#time-zone').classList.remove('opaque');

    // Find selected city in cities and destrucutre properites
    const { label, area, api } = cities.find(city => city.section === selectedSection);

    parseAndSetTime(label, area, api);

    // Update hours, minutes, seconds, and timezone every second
    // FIXME: This is not very efficient. There is probably a better way.
    updateTime = setInterval(() => {
        parseAndSetTime(label, area, api); 
    }, 1000);
}

/**
 * Create a new Date object based on the selected citie's time zone.
 * Update the DOMw with the hour, minute, second, and time zone name 
 * 
 * (IANA time zone)[https://www.iana.org/time-zones]
 * 
 * @param {String} label - Friendly city name. May be used to determine the time zone if the property [api] does not exist.
 * @param {String} area - IANA time zone area
 * @param {String} api - IANA time zone location
 */
function parseAndSetTime(label, area, api) {
    const date = new Date().toLocaleTimeString('default', { timeZone: `${area}/${api || label.replaceAll(' ', '_')}`, hour12: false, timeZoneName: 'long' });
    const [ time, ...timeZone ] = date.split(' ');
    const [ hh, mm, ss ] = time.split(':');
    const timeZoneName = timeZone.join(' ');

    if (window.innerWidth > 700) {
        setInnerText('#hh', hh);
        setInnerText('#mm', mm);
        setInnerText('#ss', ss);
        setInnerText('#time-zone', timeZoneName);
    } else {
        setInnerText('#hh', hh);
        setInnerText('#mm', mm);
        setInnerText('#ss', ss);
        setInnerText('#time-zone', timeZoneName);
    }
}

/**
 * Set a DOM node's innerText property given a valid CSS selector and text of type string.
 * 
 * @param {String} selector - A valid css selector
 * @param {String} text - Text node to insert into a DOM node
 * @returns 
 */
function setInnerText(selector, text) {
    if (typeof selector !== 'string' && typeof text !== sting) {
        console.error('both arguments to setHTML(selector, html) must be of type string');
        return;
    }

    try {
        document.querySelector(selector).innerText = text;
    } catch (error) {
        console.error(`Could not set selector '${selector}' with text '${text}.'`);
    }
}
