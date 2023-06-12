import { Router } from "express";
import { signIn, signOut, signUp, socialLogin } from "../controllers/auth";

const Auth = Router();

Auth.post("/signup", signUp);
Auth.post("/signin", signIn);
Auth.post("/social-login", socialLogin);
Auth.post("/signout", signOut);


export default Auth;

