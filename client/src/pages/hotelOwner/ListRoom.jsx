import React, { useEffect, useState } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const ListRoom = () => {

    const [rooms, setRooms] = useState([]);
    const { axios, getToken, user, currency } = useAppContext();

    //fetch rooms for hotel owner
    const fetchRooms = async () => {
        try {
            const { data } = await axios.get('/api/rooms/owner', {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            });
            if (data.success) {
                setRooms(data.rooms);
            } else {
                console.error("Failed to fetch rooms:", data.message);
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
            toast.error("Failed to fetch rooms. Please try again later.", error);
        }
    };

    //toggle availability of a room
    const toggleRoomAvailability = async (roomId) => {
      const {data} = await axios.post('/api/rooms/toggle-availability', {roomId}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }});
      if(data.success) {
        toast.success(data.message);
        fetchRooms();
      }else {
        toast.error(data.message)
      }
    }

    useEffect(()=> {
      if(user) {
        fetchRooms();
      }
    }, [user])

  return (
    <div>
        <Title align='left' font='outfit' title='Room Listings' subTitle='View, edit and manage all listed rooms. Keep the information up-to-date to provide the best experience for users.' />
        <p className='text-gray-500 mt-8'>All Rooms</p>

        <div className='w-full max-w-3xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll mt-3'>
           <table className='w-full'>
            <thead className='bg-gray-50'>
                    <tr>
                        <th className='py-3 px-4 text-gray-800 font-medium'>Name</th>
                        <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Facility</th>
                        <th className='py-3 px-4 text-gray-800 font-medium'>Price / night</th>
                        <th className='py-3 px-4 text-gray-800 font-medium text-center'>Action</th>
                    </tr>
                </thead>
                <tbody className='text-sm'>
                  {
                    rooms.map((room, index)=> (
                      <tr key={index}>
                        <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
                          {room.roomType}
                        </td>
                        <td className='py-3 max-sm:hidden px-4 text-gray-700 border-t border-gray-300'>
                          {room.amenities.join(', ')}
                        </td>
                        <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
                         {currency} {room.pricePerNight}
                        </td>
                        <td className='py-3 px-4 border-t text-center border-gray-300 text-sm text-red-500'>
                          <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
                            <input type="checkbox" className='sr-only peer' checked={room.isAvailable} onChange={()=> toggleRoomAvailability(room._id)} />
                            <div className='relative w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200'></div>
                              <span className='absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5'></span>
                          </label>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
           </table>
        </div>
    </div>
  )
}

export default ListRoom