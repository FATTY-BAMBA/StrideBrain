// jsdom has the element but not native modal methods. Browser evidence checks
// real focus containment; the existing unit assertions also exercise our guard.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}
