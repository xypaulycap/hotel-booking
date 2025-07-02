// import stripe from 'stripe'
// import Booking from '../models/Booking.js';

// //api to handle stripe webhooks
// export const stripeWebhooks = async (req, res) => {
//     //stripe gateway initialisation
//     const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//     //signature
//     const signature = req.headers['stripe-signature'];
//     let event;

//     try {
//         event = stripeInstance.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
//     } catch (error) {
//         res.status(400).send(`webhook error: ${error.message}`)
//     }

//     //handle the event
//     if(event.type === "payment_intent.succeeded"){
//         const paymentIntent = event.data.object;
//         const paymentIntentId = paymentIntent.id;

//         //sessions metadata
//         const session = await stripeInstance.checkout.sessions.list({
//             payment_intent: paymentIntentId
//         });

//         const {bookingId} = session.data[0].metadata;

//         //mark payment as paid
//         await Booking.findByIdAndUpdate(bookingId, {isPaid: true, paymentMethod: "stripe"})
//     }else{
//         console.log('Unhandled event type:', event.type);
        
//     }
//     res.json({ received: true })
// }

import stripe from 'stripe';
import Booking from '../models/Booking.js';

const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  // ✅ Use checkout.session.completed, not payment_intent.succeeded
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // ✅ Get bookingId from metadata
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error('Missing bookingId in session metadata');
      return res.status(400).send('Missing metadata');
    }

    try {
      await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: 'stripe',
      });
      console.log(`Booking ${bookingId} marked as paid.`);
    } catch (err) {
      console.error('Failed to update booking:', err.message);
      return res.status(500).send('Database update failed');
    }
  } else {
    console.log('Unhandled event type:', event.type);
  }

  res.json({ received: true });
};
