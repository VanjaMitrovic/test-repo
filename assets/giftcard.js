/*
* This is an unminified version of the giftcard.min.js file used by your theme.
* If you want to use this file, you will need to change the script reference in your theme
* Change <script src="{{ 'giftcard.min.js' | asset_url }}"> to:
* <script src="{{ 'giftcard.js' | asset_url }}">
*/
(function () {
window.addEventListener('DOMContentLoaded', function () {
  const qrCode = document.querySelector('[data-qr-code]');
  const qrNumber = document.querySelector('[data-qr-number]');
  const successMessage = document.querySelector('[data-qr-success');

  const classes = {
    hidden: 'hidden',
  };

  // eslint-disable-next-line no-new
  new QRCode(qrCode, {
    text: qrCode.dataset.identifier,
    width: 120,
    height: 120,
    imageAltText: theme.strings.qrImageAlt,
  });

  qrNumber.addEventListener('focus', (event) => {
    event.target.select();
  });

  document
    .querySelector('[data-gift-card-copy]')
    .addEventListener('click', () => {
      navigator.clipboard.writeText(qrNumber.value).then(function () {
        successMessage.classList.remove(classes.hidden);
      });
    });
});

}());
