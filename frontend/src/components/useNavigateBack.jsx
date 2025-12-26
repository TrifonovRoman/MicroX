import {useLocation, useNavigate} from 'react-router-dom';
import {useCallback} from 'react';

export const useNavigateBack = (fallbackUrl) => {
    const location = useLocation();
    const navigate = useNavigate();
    const locationKey = location.key;

    return useCallback(() => {
        if (locationKey === "default") {
            navigate(fallbackUrl, {replace: true});
        } else {
            navigate(-1);
        }
    }, [fallbackUrl, locationKey, navigate]);
};