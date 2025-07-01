import transporter from "../config/nodeMailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

//function to check availability of room
const checkRoomAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: new Date(checkOutDate) },
      checkOutDate: { $gte: new Date(checkInDate) },
    });
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    throw new Error("Error checking room availability: " + error.message);
  }
};

//api to check availability of a room
// @route POST /api/bookings/checkAvailability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, room } = req.body;
    const isAvailable = await checkRoomAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//api to book a room
// @route POST /api/bookings/book

export const bookRoom = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, room, guests } = req.body;
    const user = req.user._id; // Assuming the user ID is available in req.user

    //before booking check if room is available
    const isAvailable = await checkRoomAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Room is not available for the selected dates",
      });
    }
    //get total price for room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    //calculate total price based on number of nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days

    totalPrice *= nights;

    if (!guests || isNaN(guests) || guests <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Guests must be a valid positive number",
        });
    }

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests, // this should be a number the + operator converts string to number
      checkInDate,
      checkOutDate,
      totalPrice, // Total price for the stay
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Hotel Booking Details",
    //   text: "Hello world?", // plain‑text body
      html: `
        <h2>Your Booking Details</h2>
        <p>Dear ${req.user.username}</p>
        <p>Thank you for trusting us! Here are your booking Details:</p>
        <ul>
            <li><strong>Booking ID:</strong> ${booking._id}</li>
            <li><strong>Hotel name:</strong> ${roomData.hotel.name}</li>
            <li><strong>Location:</strong> ${roomData.hotel.address}</li>
            <li><strong>Date:</strong> ${booking.checkInDate.toString()}</li>
            <li><strong>Booking Amount:</strong>${process.env.CURRENCY || "$"} ${booking.totalPrice} /night</li>
        </ul>
        <p>We look forward to your arrival!</p>
        <p>If you need to make any changes feel free to contact us.</p>
      `, // HTML body
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Room booked successfully" });
  } catch (error) {
    console.error("Booking error:", error);
    res.json({ success: false, message: "Failed to Book Room" });
  }
};

//api to get all bookings of a user
// @route GET /api/bookings/user-bookings
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id; // Assuming the user ID is available in req.user
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

//api to get all bookings of a hotel
// @route GET /api/bookings/hotel-bookings
export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    //total bookings
    const totalBookings = bookings.length;
    //total revenue
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );
    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch hotel bookings" });
  }
};
