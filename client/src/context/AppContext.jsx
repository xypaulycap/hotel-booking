import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {useUser, useAuth} from '@clerk/clerk-react'
import {toast} from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// Create a context for the application
// This context can be used to provide global state and functions to the application
const AppContext = createContext()

// Create a provider component for the context
// This component will wrap the application and provide the context value

export const AppProvider = ({children}) => {

    const currency = import.meta.env.VITE_CURRENCY || "USD";
    const navigate = useNavigate();
    const { user } = useUser();
    const { getToken } = useAuth();

    const [isOwner, setIsOwner] = useState(false);
    const [showHotelRegistration, setShowHotelRegistration] = useState(false);
    const [searchedCities, setSearchedCities] = useState([]);
    const [rooms, setRooms] = useState([]);

    const fetchRooms = async () => {
        try {
            const {data} = await axios.get('api/rooms')
            if(data.success) {
                setRooms(data.rooms);
            } else {
                console.error("Failed to fetch rooms:", data.message);
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchUser = async ()=> {
        try {
            const {data} = await axios.get('/api/user', {headers: {Authorization: `Bearer ${await getToken()}`}})

            if(data) {
                setIsOwner(data.role === "hotelOwner");
                setSearchedCities(data.recentSearchedCities || [])
            }else{
                //retry fetching user data after 5 seconds
                setTimeout(()=> {
                    fetchUser()
                }, 5000)
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error.message)
            
        }
    }

    useEffect(()=> {

        if(user){
            fetchUser()
        }
    }, [user])

    useEffect(()=> {
        fetchRooms()
    }, [])

    const value = {

        currency,
        navigate,
        user,
        getToken,
        isOwner,
        setIsOwner,
        showHotelRegistration,
        setShowHotelRegistration,
        axios,
        searchedCities,
        setSearchedCities,
        rooms,
        setRooms,
        fetchRooms,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = ()=> useContext(AppContext);