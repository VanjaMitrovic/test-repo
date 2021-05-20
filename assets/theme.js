/*
* This is an unminified version of the theme.min.js file used by your theme.
* If you want to use this file, you will need to change the script reference in your theme
* Change <script src="{{ 'theme.min.js' | asset_url }}"> to:
* <script src="{{ 'theme.js' | asset_url }}">
*/
(function (sections,_shopify_themeA11y) {
sections = 'default' in sections ? sections['default'] : sections;

const keyCodes = {
  TAB: 'tab',
  ENTER: 'enter',
  ESC: 'escape',
  SPACE: ' ',
  END: 'end',
  HOME: 'home',
  LEFT: 'arrowleft',
  UP: 'arrowup',
  RIGHT: 'arrowright',
  DOWN: 'arrowdown',
};

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    // eslint-disable-next-line babel/no-invalid-this
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function cookiesEnabled() {
  let cookieEnabled = window.navigator.cookieEnabled;

  if (!cookieEnabled) {
    document.cookie = 'testcookie';
    cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
  }
  return cookieEnabled;
}

function getMediaQueryString({ width, limit = 'min' } = {}) {
  const mediaQueries = {
    medium: '750px',
    large: '990px',
    widescreen: '1400px',
  };

  return `(${limit}-width: ${mediaQueries[width]})`;
}

function isTouchDevice() {
  if ('maxTouchPoints' in navigator) {
    return navigator.maxTouchPoints > 0;
  } else if ('msMaxTouchPoints' in navigator) {
    return navigator.msMaxTouchPoints > 0;
  } else {
    const mQ = window.matchMedia && matchMedia('(pointer:coarse)');
    if (mQ && mQ.media === '(pointer:coarse)') {
      return Boolean(mQ.matches);
    }
  }
  return false;
}

function promiseTransitionEnd(element) {
  const events = [
    'webkitTransitionEnd',
    'otransitionend',
    'oTransitionEnd',
    'msTransitionEnd',
    'transitionend',
  ];

  const properties = [
    'WebkitTransition',
    'MozTransition',
    'OTransition',
    'msTransition',
    'transition',
  ];

  let duration = 0;
  let promise = Promise.resolve();

  properties.forEach(() => {
    /* eslint-disable-next-line */
    duration ||
      (duration = parseFloat(
        window.getComputedStyle(element).transitionDuration
      ));
  });

  if (duration > 0) {
    promise = new Promise((resolve) => {
      const handlers = events.map((event) => {
        element.addEventListener(event, handler);
        return {
          event,
          handler,
        };
      });

      function handler(event) {
        if (event.target !== element) return;

        // eslint-disable-next-line no-shadow
        handlers.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });

        resolve();
      }
    });
  }

  return promise;
}

function renderLoadingOverlay() {
  const loadingOverlay = document.createElement('div');

  loadingOverlay.innerHTML = `
    <div class="loading-overlay" data-loading-overlay>
      <div class="loading-overlay__spinner"></div>
    </div>
  `;

  return loadingOverlay;
}

class FormField {
  constructor(field) {
    this.classes = {
      floatingLabel: 'floating-label',
    };

    this.elements = {
      field,
      input: field.querySelector('input'),
    };

    if (!this.elements.input) return;

    this._setState();
    this._handleFormInputLabels();
  }

  _setState() {
    const isEmpty = !this.elements.input.value;
    const isFocused = this.elements.field.contains(document.activeElement);

    const shouldToggle = !isEmpty || isFocused;
    this.elements.field.classList.toggle(
      this.classes.floatingLabel,
      shouldToggle
    );
  }

  _handleFormInputLabels() {
    const handleChange = () => {
      this._setState();
    };

    this.elements.input.addEventListener('focusin', handleChange);
    this.elements.input.addEventListener('focusout', handleChange);
  }
}

class FormQuantityInput {
  constructor(container) {
    this.selectors = {
      input: '[data-form-quantity-input]',
      plus: '[data-form-quantity-plus]',
      minus: '[data-form-quantity-minus]',
    };

    this.elements = {
      container,
      input: container.querySelector(this.selectors.input),
      minus: container.querySelector(this.selectors.minus),
      plus: container.querySelector(this.selectors.plus),
    };

    this.value = parseInt(this.elements.input.value, 10);

    const min = parseInt(this.elements.input.getAttribute('min'), 10);
    this.min = min ? min : 1;

    this._updateMinusButton();
    this._setupEventHandlers();
  }

  _setupEventHandlers() {
    const handleClickPlus = () => {
      this._incrementValueBy(1);
    };

    const handleClickMinus = () => {
      this._incrementValueBy(-1);
    };

    const handleChange = () => {
      this.value = parseInt(this.elements.input.value, 10);
      this._updateMinusButton();
    };

    this.elements.minus.addEventListener('click', handleClickMinus);
    this.elements.plus.addEventListener('click', handleClickPlus);
    this.elements.input.addEventListener('change', handleChange);
  }

  _incrementValueBy(delta) {
    const updatedValue = isNaN(this.value)
      ? this.min
      : Math.max(this.value + delta, this.min);
    this.value = updatedValue;
    this.elements.input.value = updatedValue;
    this.elements.input.dispatchEvent(new Event('change'));

    this.elements.input.dispatchEvent(
      new Event('valueChanged', { bubbles: true })
    );

    this._updateMinusButton();
  }

  _updateMinusButton() {
    this.elements.minus.toggleAttribute(
      'disabled',
      !isNaN(this.value) && this.value === this.min
    );
  }
}

class Form {
  constructor() {
    this.selectors = {
      field: '[data-form-field]',
      quantity: '[data-form-quantity]',
      formStatus: '[data-field-status]',
    };

    this._initialize(this.selectors.field, FormField);
    this._initialize(this.selectors.quantity, FormQuantityInput);
    this._focusFormStatus();
  }

  _initialize(selector, FormElement) {
    const fields = document.querySelectorAll(selector);

    if (!fields) return;

    const initialize = (field) => {
      // eslint-disable-next-line no-new
      new FormElement(field);
    };

    fields.forEach(initialize);
  }

  /**
   * If there are elements that contain '[data-form-status]' after submitting a form, focus to that element.
   */
  _focusFormStatus() {
    const formStatusMessage = document.querySelector(this.selectors.formStatus);

    if (!formStatusMessage) return;

    // we might as well just target the first one here for cases where there might be more.
    formStatusMessage.setAttribute('tabindex', -1);
    formStatusMessage.focus();
    formStatusMessage.addEventListener(
      'blur',
      function (evt) {
        evt.target.removeAttribute('tabindex');
      },
      { once: true }
    );
  }
}

function getDefaultRequestConfig() {
  return JSON.parse(
    JSON.stringify({
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json;'
      }
    })
  );
}

function fetchJSON(url, config) {
  return fetch(url, config).then(function(response) {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  });
}

function cart() {
  return fetchJSON('/cart.js', getDefaultRequestConfig());
}



function cartAddFromForm(formData) {
  var config = getDefaultRequestConfig();
  delete config.headers['Content-Type'];

  config.method = 'POST';
  config.body = formData;

  return fetchJSON('/cart/add.js', config);
}

function cartChange(line, options) {
  var config = getDefaultRequestConfig();

  options = options || {};

  config.method = 'POST';
  config.body = JSON.stringify({
    line: line,
    quantity: options.quantity,
    properties: options.properties
  });

  return fetchJSON('/cart/change.js', config);
}



function cartUpdate(body) {
  var config = getDefaultRequestConfig();

  config.method = 'POST';
  config.body = JSON.stringify(body);

  return fetchJSON('/cart/update.js', config);
}

function key(key) {
  if (typeof key !== 'string' || key.split(':').length !== 2) {
    throw new TypeError(
      'Theme Cart: Provided key value is not a string with the format xxx:xxx'
    );
  }
}

function quantity(quantity) {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    throw new TypeError(
      'Theme Cart: An object which specifies a quantity or properties value is required'
    );
  }
}

function id(id) {
  if (typeof id !== 'number' || isNaN(id)) {
    throw new TypeError('Theme Cart: Variant ID must be a number');
  }
}

function properties(properties) {
  if (typeof properties !== 'object') {
    throw new TypeError('Theme Cart: Properties must be an object');
  }
}

function form(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError('Theme Cart: Form must be an instance of HTMLFormElement');
  }
}

function options(options) {
  if (typeof options !== 'object') {
    throw new TypeError('Theme Cart: Options must be an object');
  }

  if (
    typeof options.quantity === 'undefined' &&
    typeof options.properties === 'undefined'
  ) {
    throw new Error(
      'Theme Cart: You muse define a value for quantity or properties'
    );
  }

  if (typeof options.quantity !== 'undefined') {
    quantity(options.quantity);
  }

  if (typeof options.properties !== 'undefined') {
    properties(options.properties);
  }
}

/**
 * Cart Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Cart template.
 *
 * @namespace cart
 */

/**
 * Returns the state object of the cart
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function getState() {
  return cart();
}

/**
 * Returns the index of the cart line item
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the index number of the line item
 */
function getItemIndex(key$$1) {
  key(key$$1);

  return cart().then(function(state) {
    var index = -1;

    state.items.forEach(function(item, i) {
      index = item.key === key$$1 ? i + 1 : index;
    });

    if (index === -1) {
      return Promise.reject(
        new Error('Theme Cart: Unable to match line item with provided key')
      );
    }

    return index;
  });
}

/**
 * Fetches the line item object
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart
 * @param {number} id The variant's unique ID
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart from a product form
 * @param {object} form DOM element which is equal to the <form> node
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */
function addItemFromForm(form$$1) {
  form(form$$1);

  var formData = new FormData(form$$1);
  id(parseInt(formData.get('id'), 10));

  return cartAddFromForm(formData);
}

/**
 * Changes the quantity and/or properties of an existing line item.
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function updateItem(key$$1, options$$1) {
  key(key$$1);
  options(options$$1);

  return getItemIndex(key$$1).then(function(line) {
    return cartChange(line, options$$1);
  });
}

/**
 * Removes a line item from the cart
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Sets all quantities of all line items in the cart to zero. This does not remove cart attributes nor the cart note.
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Gets all cart attributes
 * @returns {Promise} Resolves with the cart attributes object
 */


/**
 * Sets all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Clears all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Gets cart note
 * @returns {Promise} Resolves with the cart note string
 */


/**
 * Sets cart note
 * @returns {Promise} Resolves with the cart state object
 */
function updateNote(note) {
  return cartUpdate({ note: note });
}

/**
 * Clears cart note
 * @returns {Promise} Resolves with the cart state object
 */
function clearNote() {
  return cartUpdate({ note: '' });
}

/**
 * Get estimated shipping rates.
 * @returns {Promise} Resolves with response of /cart/shipping_rates.json (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-shipping-rates)
 */

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 */

const moneyFormat = '${{amount}}';

/**
 * Format money values based on your shop currency settings
 * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
 * or 3.00 dollars
 * @param  {String} format - shop money_format setting
 * @return {String} value - formatted value
 */
function formatMoney(cents, format) {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || moneyFormat;

  function formatWithDelimiters(
    number,
    precision = 2,
    thousands = ',',
    decimal = '.'
  ) {
    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    const parts = number.split('.');
    const dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      `$1${thousands}`
    );
    const centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

const selectors = {
  cartItemsWrapper: '[data-cart-items]',
  cartItem: 'data-cart-item',
  quantityWrapper: '[data-cart-quantity-wrapper]',
  quantityInput: '[data-cart-item-quantity]',
  quantityControl: '[data-cart-item-quantity-control]',
  remove: '[data-remove]',
  cartCountBubble: '[data-cart-count-bubble]',
  cartCount: '[data-cart-count]',
  cartNote: '[data-cart-note]',
  cartPrice: '[data-cart-price]',
  priceLiveRegion: '[data-price-live-region]',
  itemUpdateLiveRegion: '[data-item-update-live-region]',
  checkoutButton: '[data-checkout-button]',
  cartItemError: '[data-cart-item-error]',
  closeButton: '[data-cart-close]',
  emptyText: '[data-cart-empty-text]',
  discounts: '[data-discounts]',
};

const classes = {
  hidden: 'hidden',
  isEmpty: 'is-empty',
  cookiesDisabled: 'cookies-disabled',
  hasError: 'has-error',
};

class Cart {
  constructor(cartElement) {
    this.elements = {
      cart: cartElement,
    };
  }

  init() {
    if (!cookiesEnabled()) {
      this.elements.cart.classList.add(classes.cookiesDisabled);
      return;
    }

    Object.assign(
      this.elements,
      this.getCartElements(),
      this.getItemElements()
    );

    this.bindContextOfThis();

    this.debouncedOnCartItemInput = debounce((event, lineItem) => {
      this.onCartItemInput(event, lineItem);
    }, 300);

    this.debouncedUpdateCartNote = debounce((event, lineItem) => {
      this.updateCartNote(event, lineItem);
    }, 300);

    if (this.elements.cart.hasAttribute('data-render-cart-items')) {
      this.renderCartItems().then(() => {
        this.addCartEvents();
      });
    } else {
      this.addCartEvents();
      this.addItemEvents();
    }
  }

  bindContextOfThis() {
    this.onCartItemInput = this.onCartItemInput.bind(this);
    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.updateCartNote = this.updateCartNote.bind(this);
  }

  getItemElements() {
    return {
      cartItems: this.elements.cart.querySelectorAll(`[${selectors.cartItem}]`),
    };
  }

  getCartElements() {
    return {
      cartNote: this.elements.cart.querySelector(selectors.cartNote),
    };
  }

  addItemEvents() {
    this.elements.cartItems.forEach((cartItem) => {
      cartItem.addEventListener('change', (event) => {
        this.debouncedOnCartItemInput(event, event.currentTarget);
      });

      cartItem.addEventListener('valueChanged', (event) => {
        this.debouncedOnCartItemInput(event, event.currentTarget);
      });

      cartItem
        .querySelector(selectors.remove)
        .addEventListener('click', this.onRemoveClick);
    });

    window.form._initialize(
      `${selectors.cartItemsWrapper} ${selectors.quantityWrapper}`,
      FormQuantityInput
    );
  }

  addCartEvents() {
    if (this.elements.cartNote) {
      this.elements.cartNote.addEventListener(
        'input',
        this.debouncedUpdateCartNote
      );
    }
  }

  onCartItemInput(event, lineItem) {
    event.preventDefault();
    const quantityInputs = lineItem.querySelectorAll(selectors.quantityInput);

    if (
      Array.from(quantityInputs).find((element) => element === event.target)
    ) {
      const value = event.target.value || 1;
      return this.updateQuantity(value, lineItem);
    }

    return false;
  }

  onRemoveClick(event) {
    event.preventDefault();
    event.currentTarget.disabled = true;
    const lineItem = event.currentTarget.closest(`[${selectors.cartItem}]`);
    this.removeItem(lineItem);
  }

  updateQuantity(value, lineItem) {
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;
    const [variantId] = key.split(':');

    const newQuantity = parseInt(value, 10);
    this.removeLineItemError(lineItem);

    this.elements.cartItemsWrapper =
      this.elements.cartItemsWrapper ||
      this.elements.cart.querySelector(selectors.cartItemsWrapper);

    this.enableLoadingOverlay();

    return updateItem(key, { quantity: newQuantity })
      .then((state) => {
        this.renderCart(state, productId);

        if (!state.item_count) {
          this.renderEmptyCart();
          return false;
        }

        return this.renderCartItems(state);
      })
      .then((state) => {
        if (!state) return;

        const updatedItem = state.items.find((item) => item.key === key);

        const totalQuantity = state.items.reduce((total, currentItem) => {
          return currentItem.id === Number(variantId)
            ? total + currentItem.quantity
            : total;
        }, 0);

        const currentLineItem = this.elements.cart.querySelector(
          `[${selectors.cartItem}="${key}"]`
        );

        if (currentLineItem) {
          currentLineItem.querySelector(selectors.quantityInput).focus();
        }

        if (newQuantity <= totalQuantity) return;

        const lineItemError = currentLineItem.querySelector(
          selectors.cartItemError
        );

        this.updateLineItemError(lineItemError, updatedItem);
      });
  }

  updateCartNote() {
    const note = this.elements.cartNote.value;

    if (note) {
      updateNote(note);
      return;
    }

    clearNote();
  }

  removeItem(lineItem) {
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;

    this.enableLoadingOverlay();

    return updateItem(key, { quantity: 0 }).then((state) => {
      this.renderCart(state, productId);
      this.renderCartItems();

      if (!state.item_count) {
        this.renderEmptyCart();
        return;
      }

      this.elements.closeButton =
        this.elements.closeButton ||
        this.elements.cart.querySelector(selectors.closeButton);

      if (!this.elements.closeButton) return;
      this.elements.closeButton.focus();
    });
  }

  onNewItemAdded(updatedItem) {
    this.renderCartItems();

    return getState().then((state) => {
      this.renderCart(state, updatedItem);
    });
  }

  updateLineItemError(lineItemError, item) {
    let errorMessage = theme.strings.quantityError;

    errorMessage = errorMessage
      .replace('[quantity]', item.quantity)
      .replace('[title]', item.title);

    lineItemError.innerHTML = errorMessage;
    lineItemError.classList.add(classes.hasError);
  }

  removeLineItemError(lineItem) {
    const lineItemError = lineItem.querySelector(selectors.cartItemError);
    lineItemError.classList.remove(classes.hasError);
    lineItemError.textContent = '';
  }

  changeCheckoutButtonState(shouldDisable) {
    this.elements.checkoutButton =
      this.elements.checkoutButton ||
      this.elements.cart.querySelector(selectors.checkoutButton);

    this.elements.checkoutButton.disabled = shouldDisable;

    if (shouldDisable) {
      this.elements.checkoutButton.setAttribute('aria-disabled', shouldDisable);
      this.elements.checkoutButton.setAttribute(
        'tabindex',
        shouldDisable ? '-1' : '0'
      );
    }
  }

  renderCartItems(state) {
    const sectionTemplate =
      this.elements.cart.getAttribute('data-cart-section-template') ||
      'cart-items';

    return fetch(`${theme.rootUrl}?section_id=${sectionTemplate}`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.cartItemsWrapper =
          this.elements.cartItemsWrapper ||
          this.elements.cart.querySelector(selectors.cartItemsWrapper);

        this.elements.cartItemsWrapper.innerHTML = html;
        Object.assign(this.elements, this.getItemElements());
        this.addItemEvents();

        this.disableLoadingOverlay();
        return state;
      });
  }

  renderCart(state) {
    this.renderSubtotalPrice(state.total_price);
    this.renderCartCountBubble(state.item_count);
    this.renderPriceLiveRegion(state);
    this.renderCartLevelDiscounts();

    if (state.item_count) {
      this.elements.cart.classList.remove(classes.isEmpty);
      this.changeCheckoutButtonState(false);
    }
  }

  renderEmptyCart() {
    this.elements.cart.classList.add(classes.isEmpty);
    this.changeCheckoutButtonState(true);

    this.elements.cartEmptyText =
      this.elements.cartEmptyText ||
      this.elements.cart.querySelector(selectors.emptyText);

    this.elements.cartEmptyText.setAttribute('tabindex', '-1');
    this.elements.cartEmptyText.focus();
    this.disableLoadingOverlay();
  }

  renderCartLevelDiscounts() {
    return fetch(`${theme.rootUrl}?section_id=cart-discounts`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.discounts =
          this.elements.discounts ||
          this.elements.cart.querySelector(selectors.discounts);

        this.elements.discounts.innerHTML = html;
      });
  }

  renderSubtotalPrice(subtotal) {
    const formattedCartPrice = formatMoney(subtotal, theme.moneyFormat);

    this.elements.cartPrice =
      this.elements.cartPrice ||
      document.body.querySelectorAll(selectors.cartPrice);

    this.elements.cartPrice.forEach((cartPrice) => {
      cartPrice.innerHTML = formattedCartPrice;
    });
  }

  renderCartCountBubble(itemCount) {
    const cartCountBubbles = document.querySelectorAll(
      selectors.cartCountBubble
    );
    const cartCounts = document.querySelectorAll(selectors.cartCount);

    cartCounts.forEach(
      (cartCount) => (cartCount.innerText = itemCount > 99 ? '99+' : itemCount)
    );
    cartCountBubbles.forEach((countBubble) =>
      countBubble.classList.toggle(classes.hidden, itemCount === 0)
    );
  }

  renderPriceLiveRegion(state) {
    const subtotal = state.total_price;

    this.elements.priceLiveRegion =
      this.elements.priceLiveRegion ||
      this.elements.cart.querySelector(selectors.priceLiveRegion);

    const priceLiveRegionText = this.formatPriceLiveRegionText(subtotal);

    this.elements.priceLiveRegion.textContent = priceLiveRegionText;
    this.elements.priceLiveRegion.setAttribute('aria-hidden', false);

    window.setTimeout(() => {
      this.elements.priceLiveRegion.setAttribute('aria-hidden', true);
    }, 1000);
  }

  renderItemUpdateLiveRegion() {
    this.elements.itemUpdateLiveRegion =
      this.elements.itemUpdateLiveRegion ||
      this.elements.cart.querySelector(selectors.itemUpdateLiveRegion);

    this.elements.itemUpdateLiveRegion.textContent =
      window.theme.strings.loading;
    this.elements.itemUpdateLiveRegion.setAttribute('aria-hidden', false);
  }

  formatPriceLiveRegionText(subtotal) {
    const formattedSubtotal = formatMoney(subtotal, theme.moneyFormat);
    return `${theme.strings.subtotal}: ${formattedSubtotal}`;
  }

  getItemFromState(key, state) {
    return state.items.find((item) => item.key === key);
  }

  enableLoadingOverlay() {
    this.loadingOverlay = renderLoadingOverlay();
    this.elements.cart.appendChild(this.loadingOverlay);
    document.activeElement.blur();
    this.renderItemUpdateLiveRegion();
  }

  disableLoadingOverlay() {
    this.elements.cartItemsWrapper =
      this.elements.cartItemsWrapper ||
      this.elements.cart.querySelector(selectors.cartItemsWrapper);

    if (this.loadingOverlay) {
      this.loadingOverlay.remove();
    }

    this.elements.itemUpdateLiveRegion =
      this.elements.itemUpdateLiveRegion ||
      this.elements.cart.querySelector(selectors.itemUpdateLiveRegion);

    this.elements.itemUpdateLiveRegion.setAttribute('aria-hidden', true);
  }
}

const selectors$1 = {
  stage: 'data-popup-stage',
  popup: 'data-popup',
  open: 'data-popup-open',
  close: 'data-popup-close',
  focus: 'data-popup-focus',
};

const classes$1 = {
  open: 'is-open',
  transitionReady: 'transition-ready',
  preventScrolling: 'prevent-scrolling',
};

class Popup {
  constructor(popup) {
    this.name = popup;
  }

  init() {
    this.elements = this._getElements();
    this._bindEvents();
    this.keyUpHandler = this._onKeyUp.bind(this);
    this.scrollPosition = window.pageYOffset;
  }

  openPopup(event) {
    if (event.preventDefault) event.preventDefault();
    this._prepareAnimation();
    this.elements.stage.classList.add(classes$1.open);
    this._sleepAnimation();

    if (this.elements.focus) {
      _shopify_themeA11y.trapFocus(this.elements.popup, { elementToFocus: this.elements.focus });
    } else {
      _shopify_themeA11y.trapFocus(this.elements.popup);
    }

    this.elements.triggerNode = event.currentTarget;
    this.elements.triggerNode.setAttribute('aria-expanded', true);
    this._enableScrollLock();

    document.addEventListener('keyup', this.keyUpHandler);
  }

  closePopup(removeFocus = true) {
    this._prepareAnimation();
    this.elements.stage.classList.remove(classes$1.open);
    this._sleepAnimation();

    if (removeFocus) {
      _shopify_themeA11y.removeTrapFocus();
      this.elements.triggerNode.focus();
      document.removeEventListener('keyup', this.keyUpHandler);
    }

    this.elements.triggerNode.setAttribute('aria-expanded', false);
    this._disableScrollLock();

    this.elements.triggerNode.dispatchEvent(
      new window.CustomEvent('popup_closed')
    );
  }

  getElements() {
    return this.elements;
  }

  _prepareAnimation() {
    this.elements.stage.classList.add(classes$1.transitionReady);
  }

  _sleepAnimation() {
    return promiseTransitionEnd(this.elements.popup).then(() => {
      this.elements.stage.classList.remove(classes$1.transitionReady);
    });
  }

  _getElements() {
    return {
      stage: document.querySelector(`[${selectors$1.stage}=${this.name}]`),
      popup: document.querySelector(`[${selectors$1.popup}=${this.name}]`),
      open: document.querySelectorAll(`[${selectors$1.open}=${this.name}]`),
      close: document.querySelectorAll(`[${selectors$1.close}=${this.name}]`),
      focus: document.querySelector(`[${selectors$1.focus}=${this.name}]`),
    };
  }

  _bindEvents() {
    this.elements.open.forEach((openButton) => {
      openButton.addEventListener('click', (event) => this.openPopup(event));
    });

    this.elements.close.forEach((closeButton) => {
      closeButton.addEventListener('click', () => this.closePopup());
    });
  }

  _enableScrollLock() {
    this.scrollPosition = window.pageYOffset;
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.classList.add(classes$1.preventScrolling);
  }

  _disableScrollLock() {
    document.body.classList.remove(classes$1.preventScrolling);
    document.body.style.removeProperty('top');
    window.scrollTo(0, this.scrollPosition);
  }

  _onKeyUp(event) {
    if (event.key.toLowerCase() === keyCodes.ESC) this.closePopup();
  }
}

const selectors$2 = {
  slider: '[data-slider]',
  slide: '[data-slide]',
  sliderButtons: '[data-slider-button]',
  previousButton: '[data-previous-slide]',
  nextButton: '[data-next-slide]',
  sliderNavigation: '[data-slider-navigation]',
  progressBar: '[data-progress-bar]',
  progressBarThumb: '[data-progress-bar-thumb]',
};

class Slider {
  constructor(container) {
    this.elements = { container };
  }

  init() {
    Object.assign(this.elements, this._getElements());
    this.slideCount = this.elements.slider.dataset.slideCount;
    this.sliderScrollWidth = this.elements.slider.scrollWidth;
    this.progressBarWidth = this.elements.progressBar.clientWidth;
    this.progressBarThumbPosition = 0;
    this.observerInitialized = false;
    this.recalculationNeeded = false;

    // this is specifically for Firefox
    this.elements.slider.scrollLeft = '0';
    this._setupObserver();
    this._setupEventHandlers();
  }

  destroy() {
    this.elements.sliderButtons.forEach((button) => {
      button.removeEventListener(
        'click',
        this.eventHandlers.onSliderButtonClick
      );
    });

    if (this.slideObserver) this.slideObserver.disconnect();
  }

  _getElements() {
    return {
      slider: this.elements.container.querySelector(selectors$2.slider),
      slides: this.elements.container.querySelectorAll(selectors$2.slide),
      sliderNavigation: this.elements.container.querySelector(
        selectors$2.sliderNavigation
      ),
      sliderButtons: this.elements.container.querySelectorAll(
        selectors$2.sliderButtons
      ),
      previousButton: this.elements.container.querySelector(
        selectors$2.previousButton
      ),
      nextButton: this.elements.container.querySelector(selectors$2.nextButton),
      progressBar: this.elements.container.querySelector(selectors$2.progressBar),
      progressBarThumb: this.elements.container.querySelector(
        selectors$2.progressBarThumb
      ),
    };
  }

  _getEventHandlers() {
    return {
      onSliderButtonClick: this._scrollTo.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.elements.sliderButtons.forEach((button) => {
      button.addEventListener('click', this.eventHandlers.onSliderButtonClick);
    });
  }

  _scrollTo(event) {
    const sliderItemSize = this.elements.slider.querySelector(selectors$2.slide)
      .clientWidth;

    this.elements.slider.scrollBy({
      left: event.currentTarget.hasAttribute('data-next-slide')
        ? sliderItemSize
        : -sliderItemSize,
    });
  }

  _styleCustomScrollBar() {
    this.progressBarThumbWidth =
      (this.amountOfVisibleSlides / this.slideCount) * 100;
    this.elements.progressBarThumb.style.width = `${this.progressBarThumbWidth}%`;
  }

  _calculateAmountOfVisibleSlides() {
    this.amountOfVisibleSlides = this.elements.container.querySelectorAll(
      '[data-active-slide]'
    ).length;
  }

  _progressBarThumbPositionCalculation() {
    this.sliderScrollWidth = this.elements.slider.scrollWidth;
    const distanceToTheLeftInPixels =
      (this.elements.slider.scrollLeft / this.sliderScrollWidth) *
      this.progressBarWidth;
    return (
      (distanceToTheLeftInPixels / this.elements.progressBarThumb.clientWidth) *
      100
    );
  }

  _moveProgressBarThumbPositionToTheEnd() {
    this.progressBarThumbPosition =
      ((this.elements.progressBar.clientWidth -
        this.elements.progressBarThumb.clientWidth) /
        this.elements.progressBarThumb.clientWidth) *
      100;
  }

  _progressBarThumbRecalculation() {
    this.lastSlideIsVisible = this.elements.slides[
      this.elements.slides.length - 1
    ].hasAttribute('data-active-slide');

    this._styleCustomScrollBar();
    this.progressBarThumbPosition = this._progressBarThumbPositionCalculation();
    if (this.lastSlideIsVisible && !this.firstSlideIsVisible) {
      this._moveProgressBarThumbPositionToTheEnd();
    }

    this.recalculationNeeded = false;
  }

  _disableScrollBarButton() {
    const fistSlideIsActive = this.elements.slides[0].hasAttribute(
      'data-active-slide'
    );
    const lastSlideIsActive = this.elements.slides[
      this.slideCount - 1
    ].hasAttribute('data-active-slide');

    if (fistSlideIsActive) {
      this.elements.previousButton.setAttribute('disabled', '');
      this.elements.nextButton.removeAttribute('disabled', '');
    } else if (lastSlideIsActive) {
      this.elements.nextButton.setAttribute('disabled', '');
      this.elements.previousButton.removeAttribute('disabled', '');
    } else {
      this.elements.sliderButtons.forEach((button) => {
        button.removeAttribute('disabled');
      });
    }
  }

  _setupObserver() {
    const options = {
      root: this.elements.container,
      threshold: 0.9,
    };

    this.slideObserver = new IntersectionObserver((records) => {
      this.progressBarWidth = this.elements.progressBar.clientWidth;

      records.forEach((record) => {
        if (record.isIntersecting) {
          this.firstSlideIsVisible = record.target === this.elements.slides[0];
          this.lastSlideIsVisible =
            record.target === this.elements.slides[this.slideCount - 1];

          if (this.firstSlideIsVisible) {
            this.progressBarThumbPosition = '0';
          } else if (this.lastSlideIsVisible) {
            this._moveProgressBarThumbPositionToTheEnd();
          } else {
            this.progressBarThumbPosition = `${this._progressBarThumbPositionCalculation()}`;
          }

          record.target.setAttribute('data-active-slide', '');
        } else {
          record.target.removeAttribute('data-active-slide');
        }
      });

      if (this.recalculationNeeded) {
        this._calculateAmountOfVisibleSlides();
        this._progressBarThumbRecalculation();
      }

      this.elements.progressBarThumb.style.transform = `translateX(${this.progressBarThumbPosition}%)`;
      this._disableScrollBarButton();

      if (this.observerInitialized) return;

      this._calculateAmountOfVisibleSlides();
      this._styleCustomScrollBar();
      this.observerInitialized = true;
    }, options);

    this.elements.slides.forEach((slide) => {
      this.slideObserver.observe(slide);
    });
  }
}

const selectors$3 = {
  addNewAddressToggle: '[data-add-new-address-toggle]',
  addressCountrySelect: '[data-address-country-select]',
  addressFormNew: '[data-address-form-new]',
  cancelEditAddressToggle: '[data-cancel-edit-address-toggle]',
  cancelNewAddressToggle: '[data-cancel-new-address-toggle]',
  customerAddresses: '[data-customer-addresses]',
  deleteAddressButton: '[data-delete-address-button]',
  editAddressToggle: '[data-edit-address-toggle]',
  editAddressId: (id) => `[data-edit-address-id="${id}"]`,
};

const attributes = {
  addNewAddressToggle: 'data-add-new-address-toggle',
};

const classes$2 = {
  hidden: 'hidden',
};

class Addresses {
  constructor() {
    this.elements = this._getElements();
    if (!this.elements.newAddressForm) return;

    this._setupEventListeners();
    this._setupCountries();
  }

  _getElements() {
    const container = document.querySelector(selectors$3.customerAddresses);
    if (!container) return false;
    return {
      container,
      newAddressForm: container.querySelector(selectors$3.addressFormNew),
      addNewAddressToggle: container.querySelector(
        selectors$3.addNewAddressToggle
      ),
      cancelNewAddressToggle: container.querySelector(
        selectors$3.cancelNewAddressToggle
      ),
      editAddressToggles: container.querySelectorAll(
        selectors$3.editAddressToggle
      ),
      cancelEditAddressToggles: container.querySelectorAll(
        selectors$3.cancelEditAddressToggle
      ),
      deleteAddressButtons: container.querySelectorAll(
        selectors$3.deleteAddressButton
      ),
    };
  }

  _setupEventListeners() {
    const toggleNewAddressToggleCallback = (event) =>
      this._toggleAddNewAddressForm(
        event,
        this.elements.addNewAddressToggle,
        this.elements.newAddressForm
      );

    [
      this.elements.addNewAddressToggle,
      this.elements.cancelNewAddressToggle,
    ].forEach((element) => {
      element.addEventListener('click', toggleNewAddressToggleCallback);
    });

    const toggleEditAddressTogglesCallback = (event) =>
      this._toggleEditAddressForm(event, this.elements.editAddressToggles);

    const editAddressToggle = (editAddress) =>
      editAddress.addEventListener('click', toggleEditAddressTogglesCallback);

    this.elements.editAddressToggles.forEach(editAddressToggle);

    const cancelEditAddressToggle = (cancelEditAddress) =>
      cancelEditAddress.addEventListener(
        'click',
        toggleEditAddressTogglesCallback
      );

    this.elements.cancelEditAddressToggles.forEach(cancelEditAddressToggle);

    const deleteSingleAddress = (deleteAddress) =>
      deleteAddress.addEventListener('click', this._deleteAddress);

    this.elements.deleteAddressButtons.forEach(deleteSingleAddress);
  }

  _setupCountries() {
    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        'AddressCountryNew',
        'AddressProvinceNew',
        {
          hideElement: 'AddressProvinceContainerNew',
        }
      );
    }

    // Initialize each edit form's country/province selector
    this.elements.container
      .querySelectorAll(selectors$3.addressCountrySelect)
      .forEach((countrySelect) => {
        const formId = countrySelect.dataset.formId;
        const countrySelector = `AddressCountry_${formId}`;
        const provinceSelector = `AddressProvince_${formId}`;
        const containerSelector = `AddressProvinceContainer_${formId}`;

        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector,
        });
      });
  }

  _toggleAddNewAddressForm(event, addNewAddressToggle, newAddressForm) {
    const button = event.currentTarget;
    const newAddressFormExpandedState = addNewAddressToggle.getAttribute(
      'aria-expanded'
    );

    const shouldExpand = newAddressFormExpandedState === 'false';

    newAddressForm.classList.toggle(classes$2.hidden, !shouldExpand);
    addNewAddressToggle.setAttribute('aria-expanded', shouldExpand);
    addNewAddressToggle.classList.toggle(classes$2.hidden, shouldExpand);

    if (button.hasAttribute(attributes.addNewAddressToggle)) return;
    addNewAddressToggle.focus();
  }

  _toggleEditAddressForm(event, editAddressToggles) {
    const button = event.currentTarget;
    const addressId = button.dataset.addressId;
    const editAddressformContainer = this.elements.container.querySelector(
      selectors$3.editAddressId(addressId)
    );
    const editButton = Array.from(editAddressToggles).find(
      (editAddressToggle) => editAddressToggle.dataset.addressId === addressId
    );

    const shouldEditExpand =
      editButton.getAttribute('aria-expanded') === 'false';

    editAddressformContainer.classList.toggle(
      classes$2.hidden,
      !shouldEditExpand
    );
    editButton.setAttribute('aria-expanded', shouldEditExpand);

    if (button.hasAttribute(attributes.editAddressFormToggle)) return;
    editButton.focus();
  }

  _deleteAddress(event) {
    const deleteButton = event.currentTarget;
    const target = deleteButton.dataset.target;

    const confirmMessage = deleteButton.getAttribute('data-confirm-message');

    // eslint-disable-next-line no-alert
    if (confirm(confirmMessage)) {
      Shopify.postLink(target, {
        parameters: { _method: 'delete' },
      });
    }
  }
}

class CollectionFilter {
  constructor(element) {
    if (!element) return;

    this.select = element;

    this.attributes = {
      collectionFilter: 'data-collection-filter',
    };

    this.handlers = {
      tags: this._onTagChange,
      sort: this._onSortChange,
    };

    this.filterType = this.select.getAttribute(
      this.attributes.collectionFilter
    );

    this._bindEvents();
  }

  destroy() {
    this.select.removeEventListener('change', this.handlers[this.filterType]);
  }

  _bindEvents() {
    this.select.addEventListener('change', this.handlers[this.filterType]);
  }

  _onTagChange(evt) {
    document.location.href = `${evt.target.value}#MainContent`;
  }

  /**
   * When choosing a "sort by" value in the dropdown
   * Keep the current url and append the new "sort by" value in the query strings
   * @param {Element} element DOM element of dropdown
   */
  _onSortChange(evt) {
    const searchParams = new window.URLSearchParams(window.location.search);
    searchParams.set('sort_by', evt.target.value);
    window.location.href = `${
      window.location.pathname
    }?${searchParams.toString()}#MainContent`;
  }
}

const selectors$4 = {
  collectionFilter: '[data-collection-filter]',
};

sections.register('collection-template', {
  onLoad() {
    this.collectionFilters = this.container.querySelectorAll(
      selectors$4.collectionFilter
    );

    this.collectionFilters.forEach(
      (collectionFilter) =>
        (this.collectionFilter = new CollectionFilter(collectionFilter))
    );
  },

  onUnload() {
    this.collectionFilters.forEach(() => this.collectionFilter.destroy());
  },
});

class Accordion {
  constructor(container, options = {}) {
    this.selectors = {
      accordionButtons: options.accordionLevel
        ? `[data-accordion-button][data-accordion-level="${options.accordionLevel}"]`
        : '[data-accordion-button]',
      accordionPanels: options.accordionLevel
        ? `[data-accordion-panel][data-accordion-level="${options.accordionLevel}"]`
        : '[data-accordion-panel]',
    };

    this.options = {
      toggleHidden: true,
      allowMultiple: false,
      accordionLevel: false,
      directionalNavigation: true,
    };

    Object.assign(this.options, options);
    this.elements = { container };
  }

  init() {
    Object.assign(this.elements, this._getElements());
    this._setupEventHandlers();
  }

  destroy() {
    this.elements.buttons.forEach((button) => {
      button.removeEventListener('click', this.eventHandlers.onButtonClick);
      if (this.options.directionalNavigation)
        button.removeEventListener('keydown', this.eventHandlers.onKeyDown);
    });
  }

  togglePanel(button) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);

    if (this.options.toggleHidden) {
      const targetPanelId = button.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      targetPanel.toggleAttribute('hidden');
    }

    const event = isExpanded ? 'panel-closed' : 'panel-open';
    button.dispatchEvent(
      new window.CustomEvent(event, { detail: { isExpanded: !isExpanded } })
    );
  }

  _onButtonClick(event) {
    const targetButton = event.currentTarget;
    const buttonSelectors = this.options.accordionLevel
      ? `[aria-expanded="true"][data-accordion-level="${this.options.accordionLevel}"]`
      : '[aria-expanded="true"]';
    const currentActive = this.elements.container.querySelector(
      buttonSelectors
    );

    this.togglePanel(targetButton);

    if (this.options.allowMultiple) return;

    if (currentActive && currentActive !== targetButton) {
      this.togglePanel(currentActive);
    }
  }

  _onKeyDown(event) {
    const buttonPosition = [...this.elements.buttons].indexOf(event.target);
    const lastElement = this.elements.buttons.length - 1;
    let index = -1;
    switch (event.key.toLowerCase()) {
      case keyCodes.HOME:
        index = 0;
        break;
      case keyCodes.END:
        index = lastElement;
        break;
      case keyCodes.UP:
        index = buttonPosition === 0 ? 0 : buttonPosition - 1;
        break;
      case keyCodes.DOWN:
        index =
          buttonPosition === lastElement ? lastElement : buttonPosition + 1;
        break;
    }

    if (index === -1) return;
    event.preventDefault();
    this.elements.buttons[index].focus();
  }

  _getElements() {
    return {
      buttons: this.elements.container.querySelectorAll(
        this.selectors.accordionButtons
      ),
      panels: this.elements.container.querySelectorAll(
        this.selectors.accordionPanels
      ),
    };
  }

  _getEventHandlers() {
    return {
      onButtonClick: this._onButtonClick.bind(this),
      onKeyDown: this._onKeyDown.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.elements.buttons.forEach((button) => {
      button.addEventListener('click', this.eventHandlers.onButtonClick);
      if (this.options.directionalNavigation)
        button.addEventListener('keydown', this.eventHandlers.onKeyDown);
    });
  }
}

class Disclosure extends Accordion {
  constructor(container, options = {}) {
    super(container, options);

    this.options = {
      toggleHidden: true,
      onButtonFocusOut: true,
      focusOutElement: false,
    };
    Object.assign(this.options, options);

    this.init();
  }

  destroy() {
    super.destroy();

    const removeButtonEventsCallback = (button) => {
      button.removeEventListener(
        'focusout',
        this.eventHandlers.onButtonFocusOut
      );
    };

    const removePanelEventsCallback = (panel) => {
      panel.removeEventListener('focusout', this.eventHandlers.onPanelFocusOut);
    };

    this.elements.buttons.forEach(removeButtonEventsCallback);

    this.elements.panels.forEach(removePanelEventsCallback);

    this.elements.container.removeEventListener(
      'keyup',
      this.eventHandlers.onContainerKeyUp
    );
  }

  _hideList(buttonElement = false, panelElement = false) {
    const setAttributeButtonCallback = (button) => {
      button.setAttribute('aria-expanded', false);
      button.dispatchEvent(
        new window.CustomEvent('panel-closed', {
          detail: { isExpanded: false },
        })
      );
    };

    const setAttributePanelCallback = (panel) => {
      if (!this.options.toggleHidden) return;
      panel.setAttribute('hidden', '');
    };

    if (buttonElement && panelElement) {
      setAttributeButtonCallback(buttonElement);
      setAttributePanelCallback(panelElement);
      return;
    }

    this.elements.buttons.forEach(setAttributeButtonCallback);
    this.elements.panels.forEach(setAttributePanelCallback);
  }

  _onPanelFocusOut(event) {
    const childInFocus = event.currentTarget.contains(event.relatedTarget);

    const hidePanelCallback = (panel) => {
      const button = panel.previousElementSibling;
      const isVisible = button.getAttribute('aria-expanded') === 'true';

      if (isVisible && !childInFocus) {
        this._hideList(button, panel);
      }
    };

    this.elements.panels.forEach(hidePanelCallback);
  }

  _onContainerKeyUp(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;

    const focusedElement = document.activeElement;
    const isExpandedButton =
      focusedElement.hasAttribute('data-accordion-button') &&
      focusedElement.getAttribute('aria-expanded') === 'true';
    const closestPanel = focusedElement.closest('[data-accordion-panel]');

    const button =
      isExpandedButton || !closestPanel
        ? focusedElement
        : closestPanel.previousElementSibling;

    const panel = button.nextElementSibling;

    button.focus();
    this._hideList(button, panel);
  }

  _onButtonFocusOut(event) {
    const disclosureLostFocus =
      this.elements.container.contains(event.relatedTarget) === false;

    if (disclosureLostFocus) {
      this._hideList();
    }
  }

  _setupEventHandlers() {
    super._setupEventHandlers();

    Object.assign(this.eventHandlers, {
      onPanelFocusOut: this._onPanelFocusOut.bind(this),
      onContainerKeyUp: this._onContainerKeyUp.bind(this),
      onButtonFocusOut: this._onButtonFocusOut.bind(this),
    });

    const addButtonEventsCallback = (button) => {
      button.addEventListener('focusout', this.eventHandlers.onButtonFocusOut);
    };

    const addPanelEventsCallback = (panel) => {
      panel.addEventListener('focusout', this.eventHandlers.onPanelFocusOut);
    };

    if (this.options.onButtonFocusOut)
      this.elements.buttons.forEach(addButtonEventsCallback);

    if (this.options.focusOutElement) {
      addPanelEventsCallback(this.options.focusOutElement);
    } else {
      this.elements.panels.forEach(addPanelEventsCallback);
    }

    this.elements.container.addEventListener(
      'keyup',
      this.eventHandlers.onContainerKeyUp
    );
  }
}

class FormSubmit {
  constructor(container) {
    this.selectors = {
      form: '[data-form-submit-form]',
      input: '[data-form-submit-input]',
      items: '[data-form-submit-item]',
    };

    this.elements = {
      form: container.querySelector(this.selectors.form),
      input: container.querySelector(this.selectors.input),
      items: container.querySelectorAll(this.selectors.items),
    };

    this._setupEventHandlers();
  }

  destroy() {
    const removeEvent = (item) => {
      item.removeEventListener('click', this.eventHandlers.onItemClick);
    };

    this.elements.items.forEach(removeEvent);
  }

  _onItemClick(event) {
    event.preventDefault();
    this._submitForm(event.currentTarget.getAttribute('data-value'));
  }

  _submitForm(value) {
    this.elements.input.value = value;
    this.elements.form.submit();
  }

  _setupEventHandlers() {
    this.eventHandlers = {
      onItemClick: this._onItemClick.bind(this),
    };

    const addEvent = (item) => {
      item.addEventListener('click', this.eventHandlers.onItemClick);
    };

    this.elements.items.forEach(addEvent);
  }
}

const selectors$5 = {
  localizationSelector: '[data-localization-selector]',
  drawerNavigation: '[data-drawer-navigation]',
  drawerNavigationList: '[data-drawer-navigation-list]',
  drawerNavigationContainer: '[data-drawer-navigation-container]',
  drawerNavigationToggle: '[data-drawer-navigation-toggle]',
  drawerNavigationSubmenuToggle: '[data-drawer-navigation-submenu-toggle]',
  headerTop: '[data-header-top]',
  inlineNavigationButton: '[data-inline-navigation-button]',
  inlineNavigationSubmenu: '[data-inline-navigation-submenu]',
  panel: '[data-panel]',
  searchToggle: '[data-search-toggle]',
};

sections.register('header', {
  onLoad() {
    this.elements = this._getElements();
    this.mqlSmall = window.matchMedia(
      getMediaQueryString({ width: 'medium', limit: 'max' })
    );
    this.mqlMedium = window.matchMedia(
      getMediaQueryString({ width: 'large', limit: 'max' })
    );

    this._setupInlineNavigation();
    this._setupDrawerNavigation();
    this._setupLocalizationSelectors();
    this._setupEventListeners();
  },

  _setupInlineNavigation() {
    if (!this.elements.inlineNavigationButtons) return;

    const inlineNavigationDisclosureCallback = (button) =>
      new Disclosure(button, {
        toggleHidden: false,
        accordionLevel: 1,
      });

    const inlineNavigationSubmenuCallback = (submenu) => {
      const accordion = new Accordion(submenu, {
        toggleHidden: false,
        allowMultiple: true,
        accordionLevel: 2,
        directionalNavigation: false,
      });
      accordion.init();
      return accordion;
    };

    this.inlineNavigationMenuDisclosures = this.elements.inlineNavigationButtons.map(
      inlineNavigationDisclosureCallback
    );

    this.inlineNavigationSubmenuAccordions = this.elements.inlineNavigationSubmenus.map(
      inlineNavigationSubmenuCallback
    );
  },

  _setupDrawerNavigation() {
    if (!this.elements.drawerNavigation) return;

    this.drawerNavigationDisclosure = new Disclosure(this.elements.headerTop, {
      toggleHidden: false,
      accordionLevel: 1,
      focusOutElement: this.elements.headerTop,
      onButtonFocusOut: false,
    });
    this.activePanel = this.elements.drawerNavigationList;
  },

  _setupLocalizationSelectors() {
    const localizationSelectors = Array.from(
      this.container.querySelectorAll(selectors$5.localizationSelector)
    );

    if (!localizationSelectors) return;

    const initiateFormAndDisclosure = (selector) => {
      return {
        disclosure: new Disclosure(selector),
        form: new FormSubmit(selector),
      };
    };

    this.localeSelectors = localizationSelectors.map(initiateFormAndDisclosure);
  },

  _setupEventListeners() {
    this.eventHandlers = this._getEventHandlers();

    const addOnClickSubmenuToggle = (toggle) =>
      toggle.addEventListener('click', this.eventHandlers.onDrawerSubmenuClick);

    const addOnDrawerNavigationToggle = (event) => {
      this.elements.drawerNavigationToggle.addEventListener(
        event,
        this.eventHandlers.onDrawerNavigationToggleClick
      );
    };

    if (this.elements.drawerNavigationToggle)
      ['panel-closed', 'panel-open'].forEach(addOnDrawerNavigationToggle);

    this.elements.drawerNavigationSubmenuToggles.forEach(
      addOnClickSubmenuToggle
    );

    if (this.elements.searchToggle)
      this.elements.searchToggle.addEventListener(
        'click',
        this.eventHandlers.onSearchToggleClick
      );
  },

  _getEventHandlers() {
    return {
      onDrawerSubmenuClick: this._onDrawerSubmenuClick.bind(this),
      onDrawerNavigationToggleClick: this._onDrawerNavigationToggleClick.bind(
        this
      ),
      onSearchToggleClick: this._onSearchToggleClick.bind(this),
    };
  },

  _getElements() {
    return {
      inlineNavigationButtons: Array.from(
        this.container.querySelectorAll(selectors$5.inlineNavigationButton)
      ),
      inlineNavigationSubmenus: Array.from(
        this.container.querySelectorAll(selectors$5.inlineNavigationSubmenu)
      ),
      drawerNavigation: this.container.querySelector(
        selectors$5.drawerNavigation
      ),
      drawerNavigationList: this.container.querySelector(
        selectors$5.drawerNavigationList
      ),
      drawerNavigationContainer: this.container.querySelector(
        selectors$5.drawerNavigationContainer
      ),
      drawerNavigationToggle: this.container.querySelector(
        selectors$5.drawerNavigationToggle
      ),
      drawerNavigationSubmenuToggles: this.container.querySelectorAll(
        selectors$5.drawerNavigationSubmenuToggle
      ),
      headerTop: this.container.querySelector(selectors$5.headerTop),
      searchToggle: this.container.querySelector(selectors$5.searchToggle),
    };
  },

  _onSearchToggleClick() {
    if (
      this.elements.drawerNavigationToggle.getAttribute('aria-expanded') ===
      'false'
    )
      return;

    this.drawerNavigationDisclosure.togglePanel(
      this.elements.drawerNavigationToggle
    );
  },

  _onDrawerNavigationToggleClick(event) {
    const isExpanded = event.detail.isExpanded;

    if (isExpanded) {
      if (this.activePanel === this.elements.drawerNavigationList) {
        this._handleDrawerTrapFocus(
          this.elements.headerTop,
          this.elements.drawerNavigation
        );
      } else {
        this._handleDrawerTrapFocus(this.activePanel);
      }
    } else {
      _shopify_themeA11y.removeTrapFocus(this.activePanel);
      this.elements.drawerNavigationToggle.focus();
    }
  },

  _onDrawerSubmenuClick(event) {
    if (!this.menuDrawerButtons) {
      this.elements.drawerNavigationList.style.height = this._setupAndGetContainerDataHeight(
        this.activePanel
      );
    }

    const button = this._setupAndGetButtonObject(event.currentTarget);

    if (button.togglesSubmenu) button.targetPanel.removeAttribute('hidden');

    this.elements.drawerNavigationList.style.transform = `translateX(${button.slidePercentage})`;
    this.elements.drawerNavigationList.style.height = this._setupAndGetContainerDataHeight(
      button.targetPanel
    );

    promiseTransitionEnd(this.elements.drawerNavigationList).then(() =>
      this._onSlideTransitionEnd(button)
    );
  },

  _setupAndGetButtonObject(element) {
    this.menuDrawerButtons = this.menuDrawerButtons || {};
    const buttonId = element.dataset.buttonId;

    if (!this.menuDrawerButtons[buttonId]) {
      const togglesSubmenu =
        element.dataset.drawerNavigationSubmenuToggle === 'true';
      const targetPanel = togglesSubmenu
        ? element.nextElementSibling
        : element.closest(`[data-panel="${element.dataset.targetPanel}"]`);

      this.menuDrawerButtons[buttonId] = {
        element,
        togglesSubmenu,
        targetPanel,
        slidePercentage: `${element.dataset.slide}%`,
        elementToFocus: togglesSubmenu
          ? targetPanel
          : element.closest(selectors$5.panel).previousElementSibling,
      };
    }

    return this.menuDrawerButtons[buttonId];
  },

  _setupAndGetContainerDataHeight(element) {
    if (!this.mqlMedium.matches && !this.mqlSmall.matches) return false;
    const viewport = this.mqlSmall.matches ? 'small' : 'medium';

    if (element.hasAttribute(`data-${viewport}-height`))
      return `${element.getAttribute(`data-${viewport}-height`)}px`;

    const height = element.getBoundingClientRect().height;
    element.setAttribute(`data-${viewport}-height`, height);

    return `${height}px`;
  },

  _onSlideTransitionEnd(button) {
    if (!button.togglesSubmenu) this.activePanel.setAttribute('hidden', '');

    this._handleDrawerTrapFocus(
      button.targetPanel,
      button.elementToFocus,
      this.activePanel
    );
    this.activePanel = button.targetPanel;
  },

  _handleDrawerTrapFocus(targetPanel, elementToFocus, currentPanel) {
    const focusContainer =
      targetPanel === this.elements.drawerNavigationList
        ? this.elements.headerTop
        : targetPanel;

    if (currentPanel) _shopify_themeA11y.removeTrapFocus(currentPanel);

    if (elementToFocus) {
      _shopify_themeA11y.trapFocus(focusContainer, { elementToFocus });
    } else {
      _shopify_themeA11y.trapFocus(focusContainer);
    }
  },

  onUnload() {
    const destroySelector = ({ disclosure, form }) => {
      disclosure.destroy();
      form.destroy();
    };

    const removeOnClickSubmenuToggle = (toggle) =>
      toggle.removeEventListener(
        'click',
        this.eventHandlers.onDrawerSubmenuClick
      );

    const removeOnDrawerNavigationToggle = (event) =>
      this.elements.drawerNavigationToggle.removeEventListener(
        event,
        this.eventHandlers.onDrawerNavigationToggleClick
      );

    const destroyAccordionOrDisclosure = (instance) => instance.destroy();

    if (this.localizationSelectors) {
      this.localizationSelectors.forEach(destroySelector);
    }

    if (this.elements.drawerNavigationToggle)
      ['panel-closed', 'panel-open'].forEach(removeOnDrawerNavigationToggle);

    this.elements.drawerNavigationSubmenuToggles.forEach(
      removeOnClickSubmenuToggle
    );

    if (this.inlineNavigationButtons) {
      this.inlineNavigationMenuDisclosures.forEach(
        destroyAccordionOrDisclosure
      );

      this.inlineNavigationSubmenuAccordions.forEach(
        destroyAccordionOrDisclosure
      );
    }

    if (this.drawerNavigationDisclosure)
      this.drawerNavigationDisclosure.destroy();

    if (this.elements.searchToggle)
      this.elements.searchToggle.removeEventListener(
        'click',
        this.eventHandlers.onSearchToggleClick
      );
  },
});

function Listeners() {
  this.entries = [];
}

Listeners.prototype.add = function(element, event, fn) {
  this.entries.push({ element: element, event: event, fn: fn });
  element.addEventListener(event, fn);
};

Listeners.prototype.removeAll = function() {
  this.entries = this.entries.filter(function(listener) {
    listener.element.removeEventListener(listener.event, listener.fn);
    return false;
  });
};

/**
 * Returns a product JSON object when passed a product URL
 * @param {*} url
 */


/**
 * Find a match in the project JSON (using a ID number) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Number} value Accepts Number (e.g. 6908023078973)
 * @returns {Object} The variant object once a match has been successful. Otherwise null will be return
 */


/**
 * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromSerializedArray(product, collection) {
  _validateProductStructure(product);

  // If value is an array of options
  var optionArray = _createOptionArrayFromOptionCollection(product, collection);
  return getVariantFromOptionArray(product, optionArray);
}

/**
 * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);

  var result = product.variants.filter(function(variant) {
    return options.every(function(option, index) {
      return variant.options[index] === option;
    });
  });

  return result[0] || null;
}

/**
 * Creates an array of selected options from the object
 * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
 * @param {Object} product Product JSON object
 * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
 */
function _createOptionArrayFromOptionCollection(product, collection) {
  _validateProductStructure(product);
  _validateSerializedArray(collection);

  var optionArray = [];

  collection.forEach(function(option) {
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
        optionArray[i] = option.value;
        break;
      }
    }
  });

  return optionArray;
}

/**
 * Check if the product data is a valid JS object
 * Error will be thrown if type is invalid
 * @param {object} product Product JSON object
 */
function _validateProductStructure(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + ' is empty.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted like jQuery's serializeArray()
 * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
 */
function _validateSerializedArray(collection) {
  if (!Array.isArray(collection)) {
    throw new TypeError(collection + ' is not an array.');
  }

  if (collection.length === 0) {
    return [];
  }

  if (collection[0].hasOwnProperty('name')) {
    if (typeof collection[0].name !== 'string') {
      throw new TypeError(
        'Invalid value type passed for name of option ' +
          collection[0].name +
          '. Value should be string.'
      );
    }
  } else {
    throw new Error(collection[0] + 'does not contain name key.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted as list of values
 * @param {Array} collection Array of object (e.g. ['36', 'Black'])
 */
function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === 'object') {
    throw new Error(options + 'is not a valid array of options.');
  }
}

var selectors$7 = {
  idInput: '[name="id"]',
  optionInput: '[name^="options"]',
  quantityInput: '[name="quantity"]',
  propertyInput: '[name^="properties"]'
};

// Public Methods
// -----------------------------------------------------------------------------

/**
 * Returns a URL with a variant ID query parameter. Useful for updating window.history
 * with a new URL based on the currently select product variant.
 * @param {string} url - The URL you wish to append the variant ID to
 * @param {number} id  - The variant ID you wish to append to the URL
 * @returns {string} - The new url which includes the variant ID query parameter
 */



/**
 * Constructor class that creates a new instance of a product form controller.
 *
 * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
 * @param {Object} product - A product object
 * @param {Object} options - Optional options object
 * @param {Function} options.onOptionChange - Callback for whenever an option input changes
 * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
 * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
 * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
 */
function ProductForm$1(element, product, options) {
  this.element = element;
  this.product = _validateProductObject(product);

  options = options || {};

  this._listeners = new Listeners();
  this._listeners.add(
    this.element,
    'submit',
    this._onSubmit.bind(this, options)
  );

  this.optionInputs = this._initInputs(
    selectors$7.optionInput,
    options.onOptionChange
  );

  this.quantityInputs = this._initInputs(
    selectors$7.quantityInput,
    options.onQuantityChange
  );

  this.propertyInputs = this._initInputs(
    selectors$7.propertyInput,
    options.onPropertyChange
  );
}

/**
 * Cleans up all event handlers that were assigned when the Product Form was constructed.
 * Useful for use when a section needs to be reloaded in the theme editor.
 */
ProductForm$1.prototype.destroy = function() {
  this._listeners.removeAll();
};

/**
 * Getter method which returns the array of currently selected option values
 *
 * @returns {Array} An array of option values
 */
ProductForm$1.prototype.options = function() {
  return _serializeOptionValues(this.optionInputs, function(item) {
    var regex = /(?:^(options\[))(.*?)(?:\])/;
    item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
    return item;
  });
};

/**
 * Getter method which returns the currently selected variant, or `null` if variant
 * doesn't exist.
 *
 * @returns {Object|null} Variant object
 */
ProductForm$1.prototype.variant = function() {
  return getVariantFromSerializedArray(this.product, this.options());
};

/**
 * Getter method which returns a collection of objects containing name and values
 * of property inputs
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm$1.prototype.properties = function() {
  var properties = _serializePropertyValues(this.propertyInputs, function(
    propertyName
  ) {
    var regex = /(?:^(properties\[))(.*?)(?:\])/;
    var name = regex.exec(propertyName)[2]; // Use just the value between 'properties[' and ']'
    return name;
  });

  return Object.entries(properties).length === 0 ? null : properties;
};

/**
 * Getter method which returns the current quantity or 1 if no quantity input is
 * included in the form
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm$1.prototype.quantity = function() {
  return this.quantityInputs[0]
    ? Number.parseInt(this.quantityInputs[0].value, 10)
    : 1;
};

// Private Methods
// -----------------------------------------------------------------------------
ProductForm$1.prototype._setIdInputValue = function(value) {
  var idInputElement = this.element.querySelector(selectors$7.idInput);

  if (!idInputElement) {
    idInputElement = document.createElement('input');
    idInputElement.type = 'hidden';
    idInputElement.name = 'id';
    this.element.appendChild(idInputElement);
  }

  idInputElement.value = value.toString();
};

ProductForm$1.prototype._onSubmit = function(options, event) {
  event.dataset = this._getProductFormEventData();

  if (event.dataset.variant) {
    this._setIdInputValue(event.dataset.variant.id);
  }

  if (options.onFormSubmit) {
    options.onFormSubmit(event);
  }
};

ProductForm$1.prototype._onFormEvent = function(cb) {
  if (typeof cb === 'undefined') {
    return Function.prototype;
  }

  return function(event) {
    event.dataset = this._getProductFormEventData();
    cb(event);
  }.bind(this);
};

ProductForm$1.prototype._initInputs = function(selector, cb) {
  var elements = Array.prototype.slice.call(
    this.element.querySelectorAll(selector)
  );

  return elements.map(
    function(element) {
      this._listeners.add(element, 'change', this._onFormEvent(cb));
      return element;
    }.bind(this)
  );
};

ProductForm$1.prototype._getProductFormEventData = function() {
  return {
    options: this.options(),
    variant: this.variant(),
    properties: this.properties(),
    quantity: this.quantity()
  };
};

function _serializeOptionValues(inputs, transform) {
  return inputs.reduce(function(options, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      options.push(transform({ name: input.name, value: input.value }));
    }

    return options;
  }, []);
}

function _serializePropertyValues(inputs, transform) {
  return inputs.reduce(function(properties, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      properties[transform(input.name)] = input.value;
    }

    return properties;
  }, {});
}

function _validateProductObject(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (typeof product.variants[0].options === 'undefined') {
    throw new TypeError(
      'Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route'
    );
  }

  return product;
}

const selectors$8 = {
  drawerContent: '[data-store-availability-drawer-content]',
  drawerOutput: '[data-store-availability-drawer-output]',
  errorTemplate: '[data-store-availability-error-template]',
  mainContent: '[data-store-availability-main-content]',
  drawerProductTitle: '[data-store-availability-drawer-product-title]',
  drawerVariantTitleWrapper:
    '[data-store-availability-drawer-variant-title-wrapper]',
  openDrawer: '[data-store-availability-open-drawer]',
  refreshList: '[data-store-availability-refresh-list]',
};

const classes$3 = {
  hidden: 'hidden',
};

class StoreAvailability {
  constructor(container, options) {
    this.container = container;
    this.errorTemplate = container.querySelector(selectors$8.errorTemplate);
    this.productTitle = this.container.getAttribute('data-product-title');
    this.hasOnlyDefaultVariant =
      this.container.getAttribute('data-has-only-default-variant') === 'true';
    this.options = {
      variant: null,
      variantLabels: [],
    };
    Object.assign(this.options, options);
    this._bindEvents();
  }

  hide() {
    this.container.innerHTML = '';
  }

  updateContent(variantId, variantOptions) {
    const variantSectionUrl = `${this.container.getAttribute(
      'data-base-url'
    )}/variants/${variantId}?section_id=store-availability`;
    this.variantOptions = variantOptions;

    fetch(variantSectionUrl)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this._render(html);
      })
      .catch(() => {
        this._renderError();
      });
  }

  _bindEvents() {
    this.container.addEventListener('click', this._onClickContainer.bind(this));
  }

  _onClickContainer(event) {
    const refreshList = event.target.closest(selectors$8.refreshList);
    const openDrawer = event.target.closest(selectors$8.openDrawer);

    // Refresh list of availabilities
    // When the fetch call failed
    if (refreshList && this.options.variant.available) {
      this.updateContent(this.options.variant.id, this.options.variant.title);
    }

    if (openDrawer && window.popups['store-availability']) {
      window.popups['store-availability'].openPopup({
        currentTarget: openDrawer,
      });
    }
  }

  _render(html) {
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(html, 'text/html');
    const mainContent = htmlDocument.documentElement.querySelector(
      selectors$8.mainContent
    );

    if (!mainContent) return;

    const drawerContent = htmlDocument.documentElement.querySelector(
      selectors$8.drawerContent
    );

    this.container.innerHTML = '';
    this.container.appendChild(mainContent);

    if (window.popups['store-availability'].elements.popup) {
      this._updateDrawer(drawerContent);
    }
  }

  _renderError() {
    const errorHTML = this.errorTemplate.content.firstElementChild.cloneNode(
      true
    );
    this.container.innerHTML = '';
    this.container.appendChild(errorHTML);
  }

  _hideVariantTitle() {
    this.drawerVariantTitleWrapper.classList.add(classes$3.hidden);
  }

  _updateDrawer(html) {
    const fragment = document.createDocumentFragment();
    const drawerContainer = window.popups['store-availability'].elements.popup;
    this.drawerOutput = drawerContainer.querySelector(selectors$8.drawerOutput);
    this.drawerProductTitle =
      this.drawerProductTitle ||
      drawerContainer.querySelector(selectors$8.drawerProductTitle);
    this.drawerVariantTitleWrapper =
      this.drawerVariantTitleWrapper ||
      drawerContainer.querySelector(selectors$8.drawerVariantTitleWrapper);

    if (this.hasOnlyDefaultVariant) {
      this._hideVariantTitle();
    }

    this.drawerProductTitle.textContent = this.productTitle;

    if (this.options.variantLabels.length > 0) {
      for (let i = 0; i < this.variantOptions.length; i++) {
        const variantRow = fragment.appendChild(document.createElement('div'));
        const variantTitle = variantRow.appendChild(
          document.createElement('span')
        );
        variantTitle.textContent = this.options.variantLabels[i];
        variantTitle.className = 'store-availability-variant__label h5';

        const variantValue = variantRow.appendChild(
          document.createElement('span')
        );
        variantValue.textContent = this.variantOptions[i];
      }
    }

    this.drawerVariantTitleWrapper.innerHTML = '';
    this.drawerVariantTitleWrapper.appendChild(fragment);

    this.drawerOutput.innerHTML = '';
    this.drawerOutput.appendChild(html);
  }
}

class ProductForm$$1 {
  constructor(container) {
    this.selectors = {
      addToCart: '[data-add-to-cart]',
      addToCartText: '[data-add-to-cart-text]',
      errorMessage: '[data-error-message]',
      errorWrapper: '[data-error-wrapper]',
      price: '[data-price]',
      productForm: '[data-product-form]',
      productJSON: '[data-product-json]',
      productMasterSelect: '[data-product-master-select]',
      regularPrice: '[data-regular-price]',
      salePrice: '[data-sale-price]',
      storeAvailability: '[data-store-availability]',
      unitPrice: '[data-unit-price]',
      unitPriceBaseUnit: '[data-unit-price-base-unit]',
      unitPriceContainer: '[data-unit-price-container]',
    };

    this.classes = {
      buttonOutline: 'button--outline',
      hidden: 'hidden',
      productOnSale: 'price--on-sale',
      productSoldOut: 'price--sold-out',
      productUnitAvailable: 'price--unit-available',
      productUnavailable: 'price--unavailable',
      visuallyHidden: 'visually-hidden',
    };

    this.elements = { container };
  }

  init() {
    Object.assign(this.elements, this._getElements());

    if (!this.elements.productForm || !this.elements.productJSON) return;

    const productJSON = JSON.parse(this.elements.productJSON.innerHTML);
    this.themeProductForm = new ProductForm$1(
      this.elements.productForm,
      productJSON,
      {
        onFormSubmit: this._onFormSubmit.bind(this),
        onOptionChange: this._onOptionChange.bind(this),
        onQuantityChange: this._onQuantityChange.bind(this),
      }
    );

    if (this.elements.storeAvailability) {
      const variant = this.themeProductForm.variant();
      const variantLabels = productJSON.options.map(
        (variantObj) => variantObj.name
      );
      this.storeAvailability = new StoreAvailability(
        this.elements.storeAvailability,
        {
          variant,
          variantLabels,
        }
      );

      if (variant) {
        this._updateStoreAvailability(variant);
      }
    }
  }

  destroy() {
    if (!this.themeProductForm) return;

    this.themeProductForm.destroy();
  }

  _getElements() {
    return {
      addToCart: this.elements.container.querySelector(
        this.selectors.addToCart
      ),
      addToCartText: this.elements.container.querySelector(
        this.selectors.addToCart
      ),
      errorMessage: this.elements.container.querySelector(
        this.selectors.errorMessage
      ),
      errorWrapper: this.elements.container.querySelector(
        this.selectors.errorWrapper
      ),
      masterSelect: this.elements.container.querySelector(
        this.selectors.productMasterSelect
      ),
      productForm: this.elements.container.querySelector(
        this.selectors.productForm
      ),
      productJSON: this.elements.container.querySelector(
        this.selectors.productJSON
      ),
      priceContainer: this.elements.container.querySelector(
        this.selectors.price
      ),
      regularPrices: this.elements.container.querySelectorAll(
        this.selectors.regularPrice
      ),
      salePrice: this.elements.container.querySelector(
        this.selectors.salePrice
      ),
      storeAvailability: this.elements.container.querySelector(
        this.selectors.storeAvailability
      ),
      unitPrice: this.elements.container.querySelector(
        this.selectors.unitPrice
      ),
      unitPriceBaseUnit: this.elements.container.querySelector(
        this.selectors.unitPriceBaseUnit
      ),
      unitPriceContainer: this.elements.container.querySelector(
        this.selectors.unitPriceContainer
      ),
    };
  }

  _onOptionChange(event) {
    this.currentVariant = event.dataset.variant;
    this._clearErrorMessage();
    this._updateMasterSelect();
    this._updateAddToCart();
    this._updatePrice();
    this._updateStoreAvailability(this.currentVariant);

    this.elements.container.dispatchEvent(
      new window.CustomEvent('formOptionChanged', {
        detail: { variant: this.currentVariant },
      })
    );
  }

  _updatePrice() {
    if (!this.elements.priceContainer) return;

    this.elements.priceContainer.classList.remove(
      this.classes.productUnavailable,
      this.classes.productOnSale,
      this.classes.productUnitAvailable,
      this.classes.productSoldOut
    );

    this.elements.priceContainer.removeAttribute('aria-hidden');

    // unavailable
    if (!this.currentVariant) {
      this.elements.priceContainer.classList.add(
        this.classes.productUnavailable
      );
      this.elements.priceContainer.setAttribute('aria-hidden', true);
      return;
    }

    // sold out
    if (!this.currentVariant.available) {
      this.elements.priceContainer.classList.add(this.classes.productSoldOut);
    }

    let regularPrice = this.currentVariant.price;

    // on sale
    if (this.currentVariant.compare_at_price > this.currentVariant.price) {
      if (!this.elements.salePrice) return;
      this.elements.salePrice.innerText = formatMoney(
        this.currentVariant.price,
        theme.moneyFormat
      );

      regularPrice = this.currentVariant.compare_at_price;

      this.elements.priceContainer.classList.add(this.classes.productOnSale);
    }

    this.elements.regularPrices.forEach((price) => {
      price.innerText = formatMoney(regularPrice, theme.moneyFormat);
    });

    this._updateUnitPrice(this.currentVariant);
  }

  _updateUnitPrice(variant) {
    this.elements.unitPriceContainer.classList.toggle(
      this.classes.hidden,
      !variant.unit_price
    );

    if (variant.unit_price) {
      this.elements.unitPrice.innerText = formatMoney(
        variant.unit_price,
        theme.moneyFormat
      );
      this.elements.unitPriceBaseUnit.innerText = this._getBaseUnit(variant);
    }
  }

  _getBaseUnit(variant) {
    return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value +
          variant.unit_price_measurement.reference_unit;
  }

  _onFormSubmit(event) {
    event.preventDefault();

    if (this.elements.addToCart.hasAttribute('aria-disabled')) return;

    addItemFromForm(this.elements.productForm)
      .then(() => {
        this._clearErrorMessage();

        if (!window.popups.cart) throw new Error('No cart drawer');
        window.popups.cart.openPopup({
          currentTarget: this.elements.addToCart,
        });
      })
      .then(() =>
        window.cart.onNewItemAdded(this.elements.productForm.dataset.productId)
      )
      .then(() => {
        _shopify_themeA11y.removeTrapFocus();
        _shopify_themeA11y.trapFocus(window.popups.cart.elements.popup);
      })
      .catch((error) => {
        if (error.message === 'No cart drawer') return;
        this._handleProductError(error);
      });
  }

  _onQuantityChange() {
    this._clearErrorMessage();
  }

  _handleProductError(error) {
    error
      .json()
      .then((message) => {
        const errorMessage = message.description
          ? message.description
          : theme.strings.cartError;

        this._showErrorMessage(errorMessage);
      })
      .catch((message) => {
        throw message;
      });
  }

  _showErrorMessage(errorMessage) {
    if (!this.elements.errorMessage || !this.elements.errorWrapper) return;

    this.elements.errorMessage.innerHTML = errorMessage;
    this.elements.errorWrapper.classList.remove(this.classes.hidden);
    this.elements.errorWrapper.setAttribute('aria-hidden', true);
    this.elements.errorWrapper.removeAttribute('aria-hidden');
  }

  _clearErrorMessage() {
    if (!this.elements.errorMessage || !this.elements.errorWrapper) return;

    this.elements.errorMessage.innerHTML = '';
    this.elements.errorWrapper.classList.add(this.classes.hidden);
  }

  _updateAddToCart() {
    if (!this.elements.addToCart) return;

    if (!this.currentVariant) {
      this.elements.addToCart.setAttribute('aria-disabled', true);
      this.elements.addToCart.setAttribute('tabindex', '-1');
      this.elements.addToCart.innerText = theme.strings.unavailable;
      this.elements.addToCart.classList.remove(this.classes.buttonOutline);
    } else if (this.currentVariant.available) {
      this.elements.addToCart.removeAttribute('aria-disabled');
      this.elements.addToCart.removeAttribute('tabindex', '-1');
      this.elements.addToCart.innerText = theme.strings.addToCart;
      this.elements.addToCart.classList.add(this.classes.buttonOutline);
    } else {
      this.elements.addToCart.setAttribute('aria-disabled', true);
      this.elements.addToCart.setAttribute('tabindex', '-1');
      this.elements.addToCart.innerText = theme.strings.soldOut;
      this.elements.addToCart.classList.remove(this.classes.buttonOutline);
    }
  }

  _updateMasterSelect() {
    if (!this.currentVariant || !this.elements.masterSelect) return;

    this.elements.masterSelect.value = this.currentVariant.id;
  }

  _updateStoreAvailability(variant) {
    if (this.storeAvailability && variant && variant.available) {
      this.storeAvailability.updateContent(variant.id, variant.options);
    } else {
      this.storeAvailability.hide();
    }
  }
}

const status = {
  REQUESTED: 'requested',
  LOADED: 'loaded',
};

const libraries = {
  youtubeSdk: {
    tagId: 'youtube-sdk',
    src: 'https://www.youtube.com/iframe_api',
    type: 'script',
  },
  plyrStyles: {
    tagId: 'plyr-shopify-styles',
    src:
      'https://cdn.shopify.com/shopifycloud/shopify-plyr/v1.1/shopify-plyr.css',
    type: 'link',
  },
  modelViewerUiStyles: {
    tagId: 'shopify-model-viewer-ui-styles',
    src:
      'https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css',
    type: 'link',
  },
};

class LibraryLoader {
  load(libraryName, callback) {
    const library = libraries[libraryName];
    if (!library || library.status === status.REQUESTED) return;
    if (library.status === status.LOADED) {
      if (callback) callback();
      return;
    }

    library.status = status.REQUESTED;

    const tag = this._createTag(library);
    tag.addEventListener('load', () => {
      library.status = status.LOADED;
      if (callback) callback();
    });

    const firstTag = document.getElementsByTagName(library.type)[0];
    firstTag.parentNode.insertBefore(tag, firstTag);
  }

  _createTag(library) {
    const tag = document.createElement(library.type);

    if (library.type === 'script') {
      tag.src = library.src;
    } else {
      tag.href = library.src;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
    }

    tag.id = library.tagId;
    return tag;
  }
}

const selectors$9 = {
  model: '[data-model-id]',
  modelJson: '[data-model-json]',
  xrButton: '[data-shopify-xr]',
};

class ProductModels {
  constructor(container) {
    this.elements = this._getElements(container);
  }

  init() {
    this._loadShopifyXR();

    if (!this.elements.models.length) return;
    this.models = {};

    this.elements.models.forEach((element) => {
      this.models[element.getAttribute('data-model-id')] = {
        element,
      };
    });

    this._loadModelViewerUI();
    this._setupEventListeners();
  }

  destroy() {
    if (!this.elements.models) return;

    this.elements.container.removeEventListener(
      'mediaUpdated',
      this.eventHandlers.onMediaUpdated
    );

    document.removeEventListener(
      'shopify_xr_launch',
      this.eventHandlers.onXRLaunch
    );
  }

  _getElements(container) {
    return {
      container,
      models: container.querySelectorAll(selectors$9.model),
      modelJson: container.querySelector(selectors$9.modelJson),
      xrButton: container.querySelector(selectors$9.xrButton),
    };
  }

  _getEventHandlers() {
    return {
      onMediaUpdated: this._onMediaUpdated.bind(this),
      onXRLaunch: this._onXRLaunch.bind(this),
    };
  }

  _setupEventListeners() {
    this.eventHandlers = this._getEventHandlers();

    this.elements.container.addEventListener(
      'mediaUpdated',
      this.eventHandlers.onMediaUpdated
    );

    document.addEventListener(
      'shopify_xr_launch',
      this.eventHandlers.onXRLaunch
    );
  }

  _onMediaUpdated(event) {
    const { oldId, newId } = event.detail;
    if (this.models[oldId]) {
      this.models[oldId].modelViewerUi.pause();
    }

    if (this.models[newId]) {
      this.elements.xrButton.dataset.shopifyModel3dId = newId;
      if (!isTouchDevice()) this.models[newId].modelViewerUi.play();
      return;
    }

    this.elements.xrButton.dataset.shopifyModel3dId = Object.keys(
      this.models
    )[0];
  }

  _onXRLaunch() {
    Object.keys(this.models).forEach((key) => {
      this.models[key].modelViewerUi.pause();
    });
  }

  _loadShopifyXR() {
    if (!this.elements.modelJson) return;

    window.Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: this._setupShopifyXR.bind(this),
      },
    ]);
  }

  _loadModelViewerUI() {
    window.Shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: this._setupModelViewerUI.bind(this),
      },
    ]);

    window.libraryLoader = window.libraryLoader || new LibraryLoader();
    window.libraryLoader.load('modelViewerUiStyles');
  }

  _setupShopifyXR(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', () =>
        this._setupShopifyXR()
      );
      return;
    }

    window.ShopifyXR.addModels(JSON.parse(this.elements.modelJson.textContent));
    window.ShopifyXR.setupXRElements();
  }

  _setupModelViewerUI(errors) {
    if (errors) return;

    Object.keys(this.models).forEach((key) => {
      const model = this.models[key];
      if (!model.modelViewerUi) {
        model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
      }
    });
  }
}

const selectors$10 = {
  video: '[data-video-id]',
};

const hosts = {
  YOUTUBE: 'youtube',
  HTML5: 'html5',
};

class ProductVideos {
  constructor(container) {
    this.elements = this._getElements(container);
  }

  init() {
    if (!this.elements.videos.length) return;
    this.videos = {};
    this.hasVideoType = {};
    this.isLoopEnabled =
      this.elements.container.getAttribute('data-video-loop') === 'true';

    const self = this;
    this.elements.videos.forEach((element) => {
      this.videos[element.getAttribute('data-video-id')] = {
        host: this._getHostFromElement(element),
        element,
        ready() {
          self._createVideoPlayer(this);
        },
      };
    });

    this._loadLibraries();
    this._setupEventListeners();
  }

  destroy() {
    if (!this.eventHandlers) return;

    this.elements.container.removeEventListener(
      'mediaUpdated',
      this.eventHandlers.onMediaUpdated
    );
  }

  _getElements(container) {
    return {
      container,
      videos: container.querySelectorAll(selectors$10.video),
    };
  }

  _setupEventListeners() {
    this.eventHandlers = { onMediaUpdated: this._onMediaUpdated.bind(this) };
    this.elements.container.addEventListener(
      'mediaUpdated',
      this.eventHandlers.onMediaUpdated
    );
  }

  _onMediaUpdated(event) {
    const { oldId, newId } = event.detail;

    if (this.videos[oldId]) {
      this._toggleVideo(this.videos[oldId], false);
    }

    if (this.videos[newId]) {
      if (!isTouchDevice()) this._toggleVideo(this.videos[newId], true);
    }
  }

  _toggleVideo(video, play) {
    if (!video.player) return;

    if (play) {
      if (video.host === hosts.HTML5) video.player.play();
      if (video.host === hosts.YOUTUBE) video.player.playVideo();
    } else {
      if (video.host === hosts.HTML5) video.player.pause();
      if (video.host === hosts.YOUTUBE) video.player.pauseVideo();
    }
  }

  _loadLibraries() {
    window.libraryLoader = window.libraryLoader || new LibraryLoader();

    if (this.hasVideoType[hosts.HTML5]) {
      window.Shopify.loadFeatures([
        {
          name: 'video-ui',
          version: '1.0',
          onLoad: this._setupPlyrVideos.bind(this),
        },
      ]);
      window.libraryLoader.load('plyrStyles');
    }

    if (this.hasVideoType[hosts.YOUTUBE]) {
      window.libraryLoader.load(
        'youtubeSdk',
        this._setupYouTubeVideos.bind(this)
      );

      const sectionId = this.elements.container.getAttribute('data-section-id');
      window.loadYTVideos = window.loadYTVideos || {};
      window.loadYTVideos[sectionId] = () => {
        this._loadVideos(hosts.YOUTUBE);
      };
    }
  }

  _setupYouTubeVideos() {
    if (!window.YT.Player) return;
    this._loadVideos(hosts.YOUTUBE);
  }

  _setupPlyrVideos(errors) {
    if (errors) return;
    this._loadVideos(hosts.HTML5);
  }

  _loadVideos(host) {
    Object.keys(this.videos).forEach((key) => {
      const video = this.videos[key];
      if (video.host === host) {
        video.ready();
      }
    });
  }

  _createVideoPlayer(video) {
    if (video.player) return;

    switch (video.host) {
      case hosts.HTML5:
        video.player = new Shopify.Plyr(video.element, {
          loop: { active: this.isLoopEnabled },
        });
        break;
      case hosts.YOUTUBE:
        // eslint-disable-next-line no-undef
        video.player = new YT.Player(video.element, {
          videoId: video.videoId,
          events: {
            onStateChange: (event) => {
              if (event.data === 0 && this.isLoopEnabled)
                event.target.seekTo(0);
            },
          },
        });
        break;
    }
  }

  _getHostFromElement(video) {
    if (video.tagName === 'VIDEO') {
      this.hasVideoType[hosts.HTML5] = true;
      return hosts.HTML5;
    }

    if (video.tagName === 'IFRAME') {
      if (
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
          video.src
        )
      ) {
        this.hasVideoType[hosts.YOUTUBE] = true;
        return hosts.YOUTUBE;
      }
    }
    return null;
  }
}

const selectors$11 = {
  image: '[data-src-zoom]',
};

const classes$4 = {
  zoom: 'zoom',
};

class Zoom {
  constructor(container) {
    this.elements = this._getElements(container);
  }

  init() {
    if (!this.elements.image || this.elements.imageZoom) return;

    this._setupImage();
  }

  destroy() {
    if (!this.elements.imageZoom) return;

    this.elements.container.removeEventListener(
      'mouseenter',
      this.eventHandlers.onMouseEnter
    );
    this.elements.container.removeEventListener(
      'mousemove',
      this.eventHandlers.onMouseMove
    );
    this.elements.container.removeEventListener(
      'mouseleave',
      this.eventHandlers.onMouseLeave
    );
  }

  _getElements(container) {
    return {
      container,
      image: container.querySelector(selectors$11.image),
    };
  }

  _getEventHandlers() {
    return {
      onMouseMove: this._onMouseMove.bind(this),
      onMouseEnter: this._onMouseEnter.bind(this),
      onMouseLeave: this._onMouseLeave.bind(this),
    };
  }

  _onMouseMove(event) {
    if (!this.elements.imageZoom || !this.imageRect) return;

    const left =
      (event.pageX - (this.imageRect.left + window.scrollX)) * this.xRatio;
    const top =
      (event.pageY - (this.imageRect.top + window.scrollY)) * this.yRatio;

    this.elements.imageZoom.style.transform = `translate(${left}px, ${top}px)`;
  }

  _onMouseEnter(event) {
    this._setupImageRatio();
    this._toggleZoomImage(event, true);
  }

  _onMouseLeave(event) {
    this._toggleZoomImage(event, false);
  }

  _toggleZoomImage(event, visible) {
    this.elements.image.style.opacity = visible ? 0 : 1;
    this.elements.imageZoom.style.opacity = visible ? 1 : 0;
  }

  _setupImage() {
    const { srcZoom } = this.elements.image.dataset;

    this._loadImage(srcZoom)
      .then((zoomElement) => {
        this.elements.imageZoom = this.elements.container.appendChild(
          zoomElement
        );
        this._setupEventListeners();
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(error);
      });
  }

  _setupImageRatio() {
    this.imageRect = this.elements.image.getBoundingClientRect();

    this.xRatio =
      (this.elements.image.width - this.elements.imageZoom.width) /
      this.elements.image.width;

    this.yRatio =
      (this.elements.image.height - this.elements.imageZoom.height) /
      this.elements.image.height;
  }

  _setupEventListeners() {
    this.eventHandlers = this._getEventHandlers();

    this.elements.container.addEventListener(
      'mouseenter',
      this.eventHandlers.onMouseEnter
    );
    this.elements.container.addEventListener(
      'mousemove',
      this.eventHandlers.onMouseMove
    );
    this.elements.container.addEventListener(
      'mouseleave',
      this.eventHandlers.onMouseLeave
    );
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = document.createElement('img');
      image.setAttribute('role', 'presentation');
      image.classList.add(classes$4.zoom);
      image.src = url;

      image.addEventListener('load', function () {
        resolve(image);
      });

      image.addEventListener('error', function (error) {
        reject(error);
      });
    });
  }
}

const selectors$6 = {
  accordion: '[data-accordion]',
  media: `[data-media-id]`,
  mediaId: (id) => `[data-media-id="${id}"]`,
  mediaType: (type) => `[data-media-type="${type}"]`,
  modelJson: '[data-model-json]',
  thumbnail: '[data-thumbnail]',
};

sections.register('product', {
  onLoad() {
    this.classes = {
      active: 'is-active',
    };

    this.elements = {};
    this.mediaById = {};
    Object.assign(this.elements, this._getElements());
    this.settings = {
      imageZoom: this.container.dataset.imageZoom === 'true',
    };

    this.productForm = new ProductForm$$1(this.container);
    this.productForm.init();

    this.activeMedia = this.container.querySelector(
      `.${this.classes.active}${selectors$6.media}`
    );

    this.mqlMedium = window.matchMedia(
      getMediaQueryString({ width: 'medium', limit: 'min' })
    );

    if (this.container.querySelector(selectors$6.mediaType('video'))) {
      this.productVideos = new ProductVideos(this.container);
      this.productVideos.init();
    }

    if (
      this.elements.images.length &&
      this.settings.imageZoom &&
      this.mqlMedium.matches
    ) {
      this.zoomImages = {};
      this.elements.images.forEach((image) => {
        this.zoomImages[image.dataset.mediaId] = new Zoom(image);
      });
      this._initImageZoom();
    }

    if (this.elements.accordion) {
      this.accordion = new Accordion(this.elements.accordion);
      this.accordion.init();
    }

    if (this.container.querySelector(selectors$6.modelJson)) {
      this.productModels = new ProductModels(this.container);
      this.productModels.init();
    }

    this._setupEventListeners();
  },

  onUnload() {
    if (this.productForm) {
      this.productForm.destroy();
    }

    if (this.productModels) {
      this.productModels.destroy();
    }

    if (this.productVideos) {
      this.productVideos.destroy();
    }

    this.container.removeEventListener(
      'formOptionChanged',
      this.eventHandlers.onFormOptionChange
    );

    if (!this.accordion) return;
    this.accordion.destroy();
  },

  _getElements() {
    return {
      accordion: this.container.querySelector(selectors$6.accordion),
      formContainer: this.container.querySelector(selectors$6.formContainer),
      media: this.container.querySelectorAll(selectors$6.media),
      images: this.container.querySelectorAll(selectors$6.mediaType('image')),
      thumbnails: this.container.querySelectorAll(selectors$6.thumbnail),
    };
  },

  _getEventHandlers() {
    return {
      onFormOptionChange: this._onFormOptionChange.bind(this),
      onThumbnailClick: this._onThumbnailClick.bind(this),
    };
  },

  _setupEventListeners() {
    this.eventHandlers = this._getEventHandlers();

    this.container.addEventListener(
      'formOptionChanged',
      this.eventHandlers.onFormOptionChange
    );

    this.elements.thumbnails.forEach((thumbnail) =>
      thumbnail.addEventListener('click', this.eventHandlers.onThumbnailClick)
    );
  },

  _onFormOptionChange(event) {
    const variant = event.detail.variant;

    if (!variant || !variant.featured_media) return;

    this._updateActiveMedia(variant.featured_media.id);
  },

  _onThumbnailClick(event) {
    const mediaId = event.target.dataset.mediaId;
    if (!mediaId) return;

    const usingKeyboard = event.detail === 0;
    this._updateActiveMedia(mediaId, usingKeyboard);
  },

  _initImageZoom() {
    if (!this.settings.imageZoom || !this.zoomImages) return;

    const activeZoom = this.zoomImages[this.activeMedia.dataset.mediaId];
    if (!activeZoom) return;

    activeZoom.init();
  },

  _fireEvent(eventName, data) {
    this.container.dispatchEvent(
      new window.CustomEvent(eventName, {
        detail: data,
      })
    );
  },

  _updateActiveMedia(newMediaId, focus = false) {
    this.elements.media.forEach((media) =>
      media.classList.remove(this.classes.active)
    );

    const { mediaId } = this.activeMedia.dataset;

    this.mediaById[newMediaId] =
      this.mediaById[newMediaId] ||
      this.container.querySelectorAll(selectors$6.mediaId(newMediaId));

    this.mediaById[newMediaId].forEach((element) => {
      element.classList.add(this.classes.active);
      if (element.getAttribute('data-media-type')) {
        this.activeMedia = element;
        this._initImageZoom();
        if (focus) element.focus();
      }
    });

    this._fireEvent('mediaUpdated', {
      oldId: mediaId,
      newId: newMediaId,
    });
  },
});

const classes$5 = {
  loadingSpacer: 'product-recommendations__loading-spacer',
};

class ProductRecommendations {
  constructor(container) {
    this.elements = { container };
  }

  init() {
    this.elements.container.classList.add(classes$5.loadingSpacer);

    this._getProductRecommendationsHTML().then((productRecommendationsHtml) => {
      this._showProductRecommendations(productRecommendationsHtml);
    });
  }

  _getProductRecommendationsHTML() {
    const { baseUrl, productId, sectionId } = this.elements.container.dataset;
    const productRecommendationsUrl = `${baseUrl}?section_id=${sectionId}&product_id=${productId}&limit=4`;

    return fetch(productRecommendationsUrl)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _showProductRecommendations(productRecommendationsHtml) {
    const productRecommendations = productRecommendationsHtml.querySelector(
      `#shopify-section-${this.elements.container.dataset.sectionId}`
    );

    this.elements.container.classList.remove(classes$5.loadingSpacer);
    if (!productRecommendations) return;
    this.elements.container.innerHTML = productRecommendations.innerHTML;
  }
}

sections.register('product-recommendations', {
  onLoad() {
    this.productRecommendations = new ProductRecommendations(this.container);
    this.productRecommendations.init();
  },
});

sections.register('footer', {
  onLoad() {
    this.selectors = {
      localeSelector: '[data-locale-selector]',
      currencySelector: '[data-currency-selector]',
    };

    this.settings = {
      // Breakpoints from src/styles/common/variables.scss
      mediaQuerySmall: 'screen and (max-width: 749px)',
    };

    this.accordion = [];

    this.initMobileBreakpoint = this._initMobileBreakpoint.bind(this);
    this.mqlSmall = window.matchMedia(this.settings.mediaQuerySmall);
    this.mqlSmall.addListener(this.initMobileBreakpoint);

    this._initMobileBreakpoint();
    this._initSelectors();
  },

  _initMobileBreakpoint() {
    if (this.mqlSmall.matches) {
      this._initFooterBlocks();
    } else {
      this._destroyFooterBlocks();
    }
  },

  _initFooterBlocks() {
    this.blockContainers =
      this.blockContainers || document.querySelectorAll('[data-footer-block]');

    this.blockContainers.forEach((container, index) => {
      this.accordion[index] = new Accordion(container);
      this.accordion[index].init();
    });
  },

  _initSelectors() {
    this.localeSelector = this.container.querySelector(
      this.selectors.localeSelector
    );
    this.currencySelector = this.container.querySelector(
      this.selectors.currencySelector
    );

    if (this.localeSelector) {
      this.localeSelectorDisclosure = new Disclosure(this.localeSelector);
      this.localeSelectorForm = new FormSubmit(this.localeSelector);
    }

    if (this.currencySelector) {
      this.currencySelectorDisclosure = new Disclosure(this.currencySelector);
      this.currencySelectorForm = new FormSubmit(this.currencySelector);
    }
  },

  _destroyFooterBlocks() {
    if (this.accordion.length > 0) {
      this.accordion.forEach((accordion, index) => {
        this.accordion[index].destroy();
      });
    }
  },

  onUnload() {
    if (this.localeSelector) {
      this.localeSelectorDisclosure.destroy();
      this.localeSelectorForm.destroy();
    }

    if (this.currencySelector) {
      this.currencySelectorDisclosure.destroy();
      this.currencySelectorForm.destroy();
    }

    if (this.mqlSmall) {
      this.mqlSmall.removeListener(this.initMobileBreakpoint);
    }

    this._destroyFooterBlocks();
  },
});

const selectors$12 = {
  bar: '[data-slideshow-section-bar]',
  progressBarFill: '[data-slideshow-section-bar-thumb]',
  control: '[data-slideshow-section-control]',
  slides: '[data-slideshow-section-slides]',
};

const attributes$1 = {
  control: 'data-slideshow-section-control',
  slideType: 'data-slide-type',
};

const classes$6 = {
  active: 'active',
};

class Slideshow {
  constructor(slideshow) {
    this.elements = {
      slideshow,
    };
  }

  init() {
    this.elements = this._getElements();
    this.handlers = this._bindEventHandlers();
    this.currentSlide = 0;
    this.slideCount = this._countSlides();
    this._activateControls();
    this._calculateProgressBar();
    this._toggleSlide(this.currentSlide, true);
    this._setupBreakpoints();
  }

  destroy() {
    this.elements.controls.forEach((control) => {
      control.removeEventListener('click', this.handlers._handleControlClick);
    });
  }

  _getElements() {
    const slideContainers = Array.from(
      this.elements.slideshow.querySelectorAll(selectors$12.slides)
    );

    return {
      bar: this.elements.slideshow.querySelector(selectors$12.bar),
      controls: this.elements.slideshow.querySelectorAll(selectors$12.control),
      slideshow: this.elements.slideshow,
      slideContainers,
      slideGroups: slideContainers.map((container) => {
        return {
          container,
          type: container.getAttribute(attributes$1.slideType),
          slides: container.children,
        };
      }),
    };
  }

  _bindEventHandlers() {
    return {
      _handleControlClick: this._handleControlClick.bind(this),
      _handleBreakpointChange: this._handleBreakpointChange.bind(this),
    };
  }

  _setupBreakpoints() {
    this.mql = window.matchMedia(
      getMediaQueryString({ width: 'medium', limit: 'min' })
    );

    this.mql.addEventListener('change', this.handlers._handleBreakpointChange);
  }

  _activateControls() {
    this.elements.controls.forEach((control) => {
      control.addEventListener('click', this.handlers._handleControlClick);
    });
  }

  _handleControlClick(event) {
    const direction = event.currentTarget.getAttribute(attributes$1.control);
    this._deactivateSlides();
    this.currentSlide = this._getNewActiveIndex(direction);
    this._toggleSlide(this.currentSlide, true);
    this._calculateProgressBar();
  }

  _handleBreakpointChange() {
    this._toggleSlide(this.currentSlide, true);
  }

  _getNewActiveIndex(direction) {
    const newIndex =
      direction === 'previous' ? this.currentSlide - 1 : this.currentSlide + 1;

    if (newIndex < 0) {
      return this.slideCount - 1;
    } else if (newIndex + 1 > this.slideCount) {
      return 0;
    }

    return newIndex;
  }

  _calculateProgressBar() {
    this.elements.progressBarFill =
      this.elements.progressBarFill ||
      this.elements.slideshow.querySelector(selectors$12.progressBarFill);

    this.elements.progressBarFill.style.width = `${100 / this.slideCount}%`;
    this.elements.progressBarFill.style.transform = `translateX(${
      this.currentSlide * 100
    }%)`;
  }

  _deactivateSlides() {
    for (let i = 0; i < this.slideCount; i++) {
      this._toggleSlide(i, false);
    }
  }

  _toggleSlide(index, activate) {
    this.elements.slideGroups.forEach((slideGroup) => {
      slideGroup.slides[index].classList.toggle(classes$6.active, activate);

      if (slideGroup.type && activate) {
        this._translateSlide(slideGroup);
      }
    });
  }

  _translateSlide(slideGroup) {
    const slideWidth = slideGroup.slides[this.currentSlide].offsetWidth;
    const containerWidth = slideGroup.container.offsetWidth;
    const padding = containerWidth - slideWidth;
    const totalPadding = this.currentSlide * padding;
    slideGroup.container.style.transform = `translateX(calc(${
      this.currentSlide * -100
    }% + ${totalPadding}px))`;
  }

  _countSlides() {
    return this.elements.slideGroups
      .map((slideGroup) => slideGroup.slides.length)
      .reduce((max = 0, count) => Math.max(max, count));
  }
}

sections.register('slideshow', {
  onLoad() {
    this.slideshow = new Slideshow(this.container);
    this.slideshow.init();
  },
  onUnload() {
    this.slideshow.destroy();
  },
});

const selectors$13 = {
  passwordButton: '[data-password-button]',
  passwordInput: '[data-password-input]',
};

const attributes$2 = {
  error: 'data-error',
  templatePassword: 'data-template-password',
};

(() => {
  const isPasswordTemplate = document.body.hasAttribute(
    attributes$2.templatePassword
  );

  if (!isPasswordTemplate) return;

  const passwordInput = document.querySelector(selectors$13.passwordInput);
  if (passwordInput.hasAttribute(attributes$2.error)) {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        showPasswordModal();
      }, 50);
    });
  }

  function showPasswordModal() {
    window.popups['password-modal'].openPopup({
      currentTarget: document.querySelector(selectors$13.passwordButton),
    });
  }
})();

const selectors$14 = {
  cancelResetPassword: '[data-cancel-reset-password]',
  customerLogin: '[data-customer-login]',
  loginContainer: '[data-login-container]',
  loginHeading: '[data-login-heading]',
  resetPasswordHeading: '[data-reset-password-heading]',
  resetPasswordLink: '[data-reset-password-link]',
  resetPasswordContainer: '[data-reset-password-container]',
  resetPasswordSuccess: '[data-reset-password-success]',
  resetPasswordSuccessMessage: '[data-reset-password-success-message]',
};

const classes$7 = {
  hidden: 'hidden',
};

(() => {
  const elements = {
    container: document.querySelector(selectors$14.customerLogin),
  };

  if (!elements.container) return;

  Object.assign(elements, _getElements());
  _checkUrlHash();
  _resetPasswordOnSuccess();
  _setupEventHandlers();

  function _getElements() {
    return {
      cancelResetPasswordLink: elements.container.querySelector(
        selectors$14.cancelResetPassword
      ),
      resetPasswordHeading: elements.container.querySelector(
        selectors$14.resetPasswordHeading
      ),
      resetPasswordLink: elements.container.querySelector(
        selectors$14.resetPasswordLink
      ),
      resetPasswordStatus: elements.container.querySelector(
        selectors$14.resetPasswordSuccess
      ),
      resetPasswordMessage: elements.container.querySelector(
        selectors$14.resetPasswordSuccessMessage
      ),
    };
  }

  function _setupEventHandlers() {
    const clickEventCallback = (event, toggle, selector) => {
      event.preventDefault();
      const element = elements.container.querySelector(selector);
      _handleContainers(element, toggle);
    };

    elements.resetPasswordLink.addEventListener('click', (event) =>
      clickEventCallback(event, true, selectors$14.resetPasswordHeading)
    );
    elements.cancelResetPasswordLink.addEventListener('click', (event) =>
      clickEventCallback(event, false, selectors$14.loginHeading)
    );
  }

  function _resetPasswordOnSuccess() {
    if (!elements.resetPasswordStatus) return;

    elements.resetPasswordMessage.classList.remove(classes$7.hidden);
  }

  function _checkUrlHash() {
    const hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash !== '#recover') return;
    _handleContainers(elements.resetPasswordHeading, true);
  }

  function _handleContainers(containerHeading, showPasswordPage) {
    const loginContainer = elements.container.querySelector(
      selectors$14.loginContainer
    );
    const resetPasswordContainer = elements.container.querySelector(
      selectors$14.resetPasswordContainer
    );

    loginContainer.classList.toggle(classes$7.hidden, showPasswordPage);
    resetPasswordContainer.classList.toggle(classes$7.hidden, !showPasswordPage);

    containerHeading.setAttribute('tabindex', '-1');
    containerHeading.focus();

    containerHeading.addEventListener('blur', () => {
      containerHeading.removeAttribute('tabindex');
    });
  }
})();

// import components

// import sections
// import templates
window.addEventListener('DOMContentLoaded', () => {
  sections.load('*');

  _shopify_themeA11y.accessibleLinks('a[href]:not([aria-describedby]', {
    messages: {
      newWindow: theme.strings.newWindow,
      external: theme.strings.external,
      newWindowExternal: theme.strings.newWindowExternal,
    },
  });
});

window.addresses = new Addresses();

// Slider initialization: THIS IS TEMPORARY AND WILL BE UPDATED IN UPCOMING PRs
window.setupSliders = function () {
  const mqlSmall = window.matchMedia(
    getMediaQueryString({ width: 'medium', limit: 'max' })
  );
  mqlSmall.breakpoint = 'small';

  const mqlMediumUp = window.matchMedia(
    getMediaQueryString({ width: 'medium', limit: 'min' })
  );
  mqlMediumUp.breakpoint = 'medium';

  const mqlMediumDown = window.matchMedia(
    getMediaQueryString({ width: 'large', limit: 'max' })
  );
  mqlMediumDown.breakpoint = 'medium';

  const mqlLarge = window.matchMedia(
    getMediaQueryString({ width: 'large', limit: 'min' })
  );
  mqlLarge.breakpoint = 'large';

  const sliders = document.querySelectorAll('[data-slider-wrapper]');
  window.sliders = {
    small: [],
    medium: [],
    large: [],
  };

  if (!sliders.length) return;

  sliders.forEach((sliderContainer) => {
    const newSlider = new Slider(sliderContainer);
    const newSliderEntry = {
      slider: newSlider,
      breakpoint: newSlider.elements.container.dataset.sliderWrapper,
    };
    newSlider.init();
    window.sliders[newSliderEntry.breakpoint].push(newSliderEntry.slider);
  });

  const triggerProgressBarRecalculation = (sliderBreakpoint) => {
    sliderBreakpoint.forEach((slider) => {
      slider.recalculationNeeded = true;
      setTimeout(() => {
        slider.recalculationNeeded = false;
      }, 250);
    });
  };

  [mqlSmall, mqlMediumUp, mqlMediumDown, mqlLarge].forEach((mql) => {
    mql.addEventListener('change', (event) => {
      if (!event.matches) return;

      let slidersToTarget;

      if (mql.breakpoint === 'small' || mql.breakpoint === 'medium') {
        slidersToTarget = [
          ...window.sliders.small,
          ...window.sliders.medium,
          ...window.sliders.large,
        ];
      } else {
        slidersToTarget = [...window.sliders.medium, ...window.sliders.large];
      }
      if (!slidersToTarget.length) return;

      triggerProgressBarRecalculation(slidersToTarget);
    });
  });
};

window.setupSliders();
// End of slider initialization

window.form = new Form();

const cartElement = document.querySelector('[data-cart]');

if (cartElement) {
  window.cart = new Cart(cartElement);
  window.cart.init();
}

window.popups = [...document.querySelectorAll('[data-popup]')].reduce(
  (obj, popup) => {
    const currentPopup = new Popup(popup.dataset.popup);
    currentPopup.init();

    return Object.assign(obj, {
      [popup.dataset.popup]: currentPopup,
    });
  },
  {}
);

window.onYouTubeIframeAPIReady = () => {
  Object.keys(window.loadYTVideos).forEach((sectionId) =>
    window.loadYTVideos[sectionId]()
  );
};

}(Shopify.theme.sections,Shopify.theme.a11y));
