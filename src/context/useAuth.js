import { useContext } from "react";
import { Auth } from "./authContextValue";

export const useAuth = () => useContext(Auth);
