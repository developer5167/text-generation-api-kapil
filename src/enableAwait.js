let enablePaymentAwait = false;

module.exports = {
  getEnablePaymentAwait: () => enablePaymentAwait,
  setEnablePaymentAwait: (value) => { enablePaymentAwait = value; }
};