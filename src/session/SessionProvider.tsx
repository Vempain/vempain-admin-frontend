import {createContext, useContext, useEffect, useState} from "react";
import {ActionResultEnum, type LoginRequest, type LoginStatus, type LoginVO} from "../models";
import {authAPI} from "../services";

// Define the type for the session context
interface SessionContextType {
    userSession: LoginVO | null;
    loginUser: (loginRequest: LoginRequest) => Promise<LoginStatus>;
    logoutUser: () => void;
}

// Create a context to hold the session information
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Create a SessionProvider component
export function SessionProvider({children}: any) {
    const [user, setUser] = useState<LoginVO | null>(null);
    const userKey: string = "vempainUser";
    // Check if user data exists in local storage on initial load
    useEffect(() => {
        const userData = localStorage.getItem(userKey);

        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [userKey]);

    // Function to handle login
    const loginUser = (loginRequest: LoginRequest): Promise<LoginStatus> => {
        return authAPI.login(loginRequest)
                .then((jwtResponse) => {
                    localStorage.setItem(userKey, JSON.stringify(jwtResponse));
                    setUser(jwtResponse);
                    return {
                        status: ActionResultEnum.SUCCESS,
                        message: "Login successful"
                    };
                })
                .catch((error) => {
                    return {
                        status: ActionResultEnum.FAILURE,
                        message: "Failed to log on user"
                    };
                });
    };

    // Function to handle logout
    const logoutUser = () => {
        setUser(null);
        console.log("Logging out so set user data to null and calling authService.logout()");
        authAPI.logout();
    };

    const contextValue: SessionContextType = {
        userSession: user,
        loginUser,
        logoutUser
    };

    return (
            <SessionContext.Provider value={contextValue} key={"MainContext"}>
                {children}
            </SessionContext.Provider>
    );
}

// Custom hook to use session data in components
export function useSession(): SessionContextType {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}
