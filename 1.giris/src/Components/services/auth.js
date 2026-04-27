
import axios from 'axios';

export const checkUserAuthenticated = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }

        const response = await axios.get('http://localhost:8080/api/auth/verify-token', {  
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.status === 200;
    } catch (error) {
        console.error('Token validation error', error);
        return false;
    }
};
 
