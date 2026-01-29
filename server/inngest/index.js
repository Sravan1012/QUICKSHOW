import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.create(userData);
  },
);

// Inngest function to delete from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  },
);

// Inngest function to update in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  },
);

// Inngest function to cancel booking and release seats of show after 10mins of booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      // If payment is not made, release seats and delete booking
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    });
  },
);

// Inngest Function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.bookend" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    // Make sure booking exists
    if (!booking) return;

    // Send the email
    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
  <h2 style="color: #4CAF50; text-align: center;">Payment Confirmed!</h2>
  <p>Hi <strong>${booking.user.name}</strong>,</p>
  <p>Your booking for <strong style="color: #F84565;">${booking.show.movie.title}</strong> is confirmed.</p>
  <div style="text-align: center; margin: 15px 0;">
    <img src="${image_base_url + booking.show.movie.poster_path}" alt="${booking.show.movie.title}" style="max-width: 200px; border-radius: 8px;">
  </div>
  <div style="margin: 15px 0; padding: 15px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <p><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</p>
    <p><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}</p>
    <p><strong>Seats:</strong> ${booking.bookedSeats.join(", ")}</p>
    <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>
  </div>
  <div style="text-align: center; margin: 20px 0;">
    <a href="${booking.paymentLink}" style="display:inline-block; background-color:#4CAF50; color:#fff; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold;">View Booking</a>
  </div>
  <p>Enjoy the show!</p>
  <p>Thanks for booking with us!<br>- QuickShow Team</p>
  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
  <p style="font-size:12px; color:#777; text-align:center;">If you did not make this payment, please contact our support immediately.</p>
</div>`,
    });
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
];
