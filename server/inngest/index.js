import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });
const image_base_url = process.env.VITE_TMDB_IMAGE_BASE_URL || "";

// ---------------------- User Sync Functions ----------------------

// Create user in DB
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    await User.create({
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    });
  },
);

// Delete user from DB
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  },
);

// Update user in DB
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    await User.findByIdAndUpdate(id, {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    });
  },
);

// ---------------------- Release Seats Function ----------------------

// Release seats if payment not made within 10 minutes
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const bookingId = event.data.bookingId;

    // Check immediately if booking is already paid
    let booking = await Booking.findById(bookingId);
    if (!booking) return;
    if (booking.isPaid) {
      console.log("Booking already paid. Seats are safe.");
      return;
    }

    // Wait 10 minutes
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    // Check payment status after wait
    booking = await Booking.findById(bookingId);
    if (!booking) return;

    if (!booking.isPaid) {
      const show = await Show.findById(booking.show);
      booking.bookedSeats.forEach((seat) => delete show.occupiedSeats[seat]);
      show.markModified("occupiedSeats");
      await show.save();
      await Booking.findByIdAndDelete(booking._id);
      console.log(`Booking ${bookingId} canceled due to non-payment.`);
    } else {
      console.log(
        `Booking ${bookingId} paid before 10 minutes. No action needed.`,
      );
    }
  },
);

// ---------------------- Booking Email Function ----------------------

// Send email after payment confirmed
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event }) => {
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    if (!booking) return;

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

// Inngest Function to send remainders
const sendShowRemainders = inngest.createFunction(
  { id: "send-show-remainders" },
  { cron: "0 */8 * * *" }, // Every 8 hours
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 + 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    // Prepare reminder tasks
    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours },
      }).populate("movie");

      const tasks = [];

      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if (userIds.length === 0) continue;

        const users = await User.find({ _id: { $in: userIds } }).select(
          "name email",
        );

        for (const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime,
          });
        }
      }
      return tasks;
    });

    if (reminderTasks.length === 0) {
      return { sent: 0, message: "No reminders to send." };
    }

    // Send reminder emails
    const results = await step.run("send-all-reminders", async () => {
      return await Promise.allSettled(
        reminderTasks.map((task) =>
          sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
            body: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Hello ${task.userName},</h2>

  <p>This is a quick reminder that your movie:</p>

  <h3 style="color: #F84565;">${task.movieTitle}</h3>

  <p>
    is scheduled for 
    <strong>
      ${new Date(task.showTime).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}
    </strong> 
    at 
    <strong>
      ${new Date(task.showTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}
    </strong>.
  </p>

  <p>
    It starts in approximately <strong>8 hours</strong> – make sure you're ready!
  </p>

  <br/>
  <p>
    Enjoy the show!<br/>
    QuickShow Team
  </p>
</div>`,
          }),
        ),
      );
    });

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Sent ${sent} reminder(s), ${failed} failed.`,
    };
  },
);

// ---------------------- Export all functions ----------------------
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowRemainders,
];
