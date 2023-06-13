import { Router } from "express";
import { VerifyEmail, signIn, signOut, signUp, socialLogin } from "../controllers/auth";

const Auth = Router();

Auth.post("/signup", signUp);
Auth.post("/signin", signIn);
Auth.get("/verify-email", VerifyEmail) // ?token=token
Auth.post("/social-login", socialLogin);
Auth.post("/signout", signOut);


export default Auth;

