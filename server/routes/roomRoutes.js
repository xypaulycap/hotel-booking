import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { createRoom, getAllRooms, getOwnerRooms, toggleRoomAvailability } from '../controllers/roomController.js';

const roomRouter = express.Router();

roomRouter.post('/',upload.array('images', 4), protect, createRoom);
roomRouter.get('/',getAllRooms);
roomRouter.get('/owner',protect, getOwnerRooms);
roomRouter.post('/toggle-availability',protect, toggleRoomAvailability);

export default roomRouter;