import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {BrowserRouter} from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import {SessionProvider} from "@vempain/vempain-auth-frontend";

const root = ReactDOM.createRoot(
        document.getElementById("root") as HTMLElement
);
root.render(
        <React.StrictMode>
            <SessionProvider baseURL={`${import.meta.env.VITE_APP_API_URL}`}>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </SessionProvider>
        </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
