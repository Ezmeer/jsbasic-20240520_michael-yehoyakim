import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
  }

  addProduct(product = null) {
    if (product) {
      let item = this.cartItems.find(item => item.product.id === product.id);

      if (item) {
        item.count += 1;
      }
      else {
        item = {
          product: product,
          count: 1
        };
        this.cartItems.push(item);
      }

      this.onProductUpdate(item);
    }
  }

  updateProductCount(productId, amount) {
    let found = this.cartItems.find(item => item.product.id === productId);
    if (found) {
      found.count += amount;
      this.onProductUpdate(found);
    }
  }

  isEmpty() {
    return this.getTotalCount() === 0;
  }

  getTotalCount() {
    let totalCount = 0;
    for (let item of this.cartItems){
      totalCount += item.count;
    }
    return totalCount;
  }

  getTotalPrice() {
    let totalPrice = 0;
    for (let item of this.cartItems) {
      totalPrice += (item.product.price) * item.count;
    }
    return totalPrice;
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${
      product.id
    }">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(
              2
            )}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    let modal = new Modal();
    modal.setTitle('Your order');

    let node = document.createElement('div');
    for (let item of this.cartItems) {
      node.append(this.renderProduct(item.product, item.count));
    }

    let form = this.renderOrderForm();
    node.append(form);

    modal.setBody(node);

    modal.open();

    modal.elem.addEventListener('click', this.onClickPlusMinus);
    form.addEventListener('submit', this.onSubmit);

    return modal;
  }

  onClickPlusMinus = (event) => {
    let plusButton = event.target.closest('.cart-counter__button_plus');
    let minusButton = event.target.closest('.cart-counter__button_minus');
    let product = event.target.closest('.cart-product');

    if (plusButton && product) {
      this.updateProductCount(product.dataset.productId, 1);
    }
    if (minusButton && product) {
      this.updateProductCount(product.dataset.productId, -1);
    }
  }

  onProductUpdate(cartItem) {
    this.cartIcon.update(this);

    if (!document.body.classList.contains('is-modal-open')) {
      return;
    }

    let productId = cartItem.product.id;
    let modalBody = document.querySelector('.modal__body');

    let productCount = modalBody.querySelector(`[data-product-id="${productId}"] .cart-counter__count`);
    let productPrice = modalBody.querySelector(`[data-product-id="${productId}"] .cart-product__price`);
    let infoPrice = modalBody.querySelector(`.cart-buttons__info-price`);

    productCount.innerHTML = cartItem.count;

    productPrice.innerHTML = `€${(cartItem.product.price * cartItem.count).toFixed(2)}`;
    infoPrice.innerHTML = `€${this.getTotalPrice().toFixed(2)}`;

    if (cartItem.count === 0) {
      modalBody.querySelector(`[data-product-id="${productId}"]`).remove();
    }

    if (this.isEmpty()) {
      document.querySelector('.modal').remove();
      document.body.classList.remove('is-modal-open');
    }
}



  onSubmit = (event) => {
    event.preventDefault();

    let form = document.querySelector('.cart-form');
    form.querySelector('button').classList.add('is-loading');

    let formData = new FormData(form);

    let promise = fetch('https://httpbin.org/post', {
      method:'POST',
      body: formData
    });

    promise.then((response) => {
      if (response.status === 200) {
        if(document.querySelector('.modal__title')) {
          document.querySelector('.modal__title').textContent = 'Success!';
        }

        for (let i=0; i<this.cartItems.length; i++){
          delete this.cartItems[i];
        }
        this.cartItems = [];

        if (document.querySelector('.modal__body')) {
          document.querySelector('.modal__body').innerHTML = `
          <div class="modal__body-inner">
            <p>
              Order successful! Your order is being cooked :) <br>
              We’ll notify you about delivery time shortly.<br>
              <img src="/assets/images/delivery.gif">
            </p>
          </div>
        `;
        }
      }
    });
  };

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}

