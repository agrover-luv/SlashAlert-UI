import { useDispatch, useSelector } from 'react-redux';

// Custom hooks for typed Redux usage
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);

// Auth-specific hooks for convenience
export const useAuth = () => useAppSelector((state) => state.auth);
export const useAuthToken = () => useAppSelector((state) => state.auth.token);
export const useAuthUser = () => useAppSelector((state) => state.auth.user);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);