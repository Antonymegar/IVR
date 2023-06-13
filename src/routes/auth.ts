import { Router } from "express";
import { VerifyEmail, changePassword, forgotPassword, signIn, signOut, signUp, socialLogin } from "../controllers/auth";

const Auth = Router();

Auth.post("/signup", signUp);
Auth.post("/signin", signIn);
Auth.get("/verify-email", VerifyEmail) // ?token=token
Auth.post("/social-login", socialLogin);
Auth.post("/forgot-password", forgotPassword)
Auth.post("/change-password", changePassword)
Auth.post("/signout", signOut);


export default Auth;

