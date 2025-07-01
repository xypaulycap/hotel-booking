import Hotel from "../models/Hotel.js";
import User from "../models/User.js";



// @desc Register a new hotel
// @route POST /api/hotel/register
export const registerHotel = async (req, res) => {

    try {
        const { name, address, contact, city } = req.body;
        const owner = req.user.id; // Assuming the user is authenticated and their ID is available in req.user

        //check if user is already registered
        const hotel = await Hotel.findOne({owner})

        if (hotel) {
            return res.status(400).json({ success: false, message: "User already registered a hotel" });
        }

        const newHotel = await Hotel.create({
            name,
            address,
            contact,
            owner,
            city
        });

        await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

        res.status(201).json({ success: true, message: "Hotel registered successfully", data: hotel });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}