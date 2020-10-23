const message =
    i % 3 === 0 && i % 5 === 0 ?
        'fizzbuzz'
    : i % 3 === 0 ?
        'fizz'
    : i % 5 === 0 ?
        'buzz'
    :
        String(i)

const paymentMessage = state == 'success'
  ? 'Payment completed successfully'

: state == 'processing'
  ? 'Payment processing'

: state == 'invalid_cvc'
  ? 'There was an issue with your CVC number'

: state == 'invalid_expiry'
  ? 'Expiry must be sometime in the past.'

  : 'There was an issue with the payment.  Please contact support.'

const paymentMessage2 = state == 'success'
  ? 1 //'Payment completed successfully'

: state == 'processing'
  ? 2 //'Payment processing'

: state == 'invalid_cvc'
  ? 3 //'There was an issue with your CVC number'

: true //state == 'invalid_expiry'
  ? 4 //'Expiry must be sometime in the past.'

  : 5 // 'There was an issue with the payment.  Please contact support.'
