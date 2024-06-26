import Axios, {AxiosInstance} from "axios";
import {LoginRequest} from "../models/Requests";
import {JwtResponse} from "../models/Responses";

class AuthAPI {
    userKey: string = 'vempainUser';

    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
    }

    async login(user: LoginRequest): Promise<JwtResponse> {
        const response = await this.axiosInstance.post<JwtResponse>("", user);

        if (response.status === 200 && response.data.id > 0) {
            const session: JwtResponse = response.data;

            localStorage.setItem(this.userKey, JSON.stringify(session));
            console.log('After login post, set user session in local storage:', session);
        } else {
            if (response.status !== 200) {
                console.error("The response status was " + response.status + ": " + JSON.stringify(response));
            } else {
                console.error("The response did not contain data.token: " + JSON.stringify(response));
            }
        }

        return response.data;
    }

    logout() {
        console.log('Logout so clearing out local storage');
        localStorage.removeItem(this.userKey);
        console.info("Removed user key from local storage");
    }
}

export const authAPI = new AuthAPI("/login");
