import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_placeholder',
  key_secret: 'placeholder_secret',
});

async function test() {
  try {
    const order = await razorpay.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_receipt'
    });
    console.log('Order created:', order);
  } catch (err) {
    console.log('Error details:', JSON.stringify(err, null, 2));
  }
}

test();
