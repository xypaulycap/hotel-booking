import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import {v2 as cloudinary} from 'cloudinary';

//api to create room
export const createRoom = async (req, res) => {

    try {
        const {roomType, pricePerNight, amenities } = req.body;
        // const hotel = await Hotel.findOne({ owner: req.auth.user.id });

        // ✅ Updated: Use req.auth() to fix deprecation
        const { userId } = await req.auth(); 

        const hotel = await Hotel.findOne({ owner: userId });


        if(!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        //upload images to cloudinary
        const uploadImages = req.files.map(async (file) => {
            const response = await cloudinary.uploader.upload(file.path);
            return response.secure_url;
        })

        //wait for all images to be uploaded
        const images = await Promise.all(uploadImages);

        await Room.create({
            hotel: hotel._id,
            roomType,
            pricePerNight: +pricePerNight,
            amenities: JSON.parse(amenities),
            images,
        });

        res.json({ success: true, message: "Room created successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}



//api to get all rooms of a hotel
export const getAllRooms = async (req, res) => {
    try {
        
       const rooms =  await Room.find({isAvailable: true}).populate({
        path: 'hotel',
        populate: {
            path: 'owner',
            select: 'image'
        }
       }).sort({ createdAt: -1 });
       res.json({success: true, rooms});

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}



//api to get all rooms for a specific hotel
export const getOwnerRooms = async (req, res) => {
    try {
        const { userId } = await req.auth(); 

        const hotelData = await Hotel.findOne({owner: userId});
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}


//api to toggle availability of a room
export const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.body;
        const roomData = await Room.findById(roomId);
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();

        res.json({ success: true, message: "Room availability updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}
