import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { sendEmail } from "../helpers/index.js";
import Token from "../models/token.js";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import e, { Request, Response } from "express";
import { User, authenticate, createUser, findUserByEmail, newUser } from "../models/user.js";
import { CookieOptions } from "express-serve-static-core";

dotenv.config();

const generateJWT = (id: string, email: string) => {
  const secrete = process.env.JWT_SECRET || "secrete";
  return jwt.sign({ id, email }, secrete, { expiresIn: "30d", });
}

const decodeJWT = (token: string): { id: string, email: string } | null => {
  try {
    const secrete = process.env.JWT_SECRET || "secrete";
    const payload = jwt.verify(token, secrete);
    return payload as { id: string, email: string };
  } catch (error) {
    console.log(error);
    return null;
  }
}

const cookieOptions: CookieOptions = {
  httpOnly: true, secure: true, sameSite: "none", maxAge: 1000 * 60 * 60 * 24
}

const sendVerificationEmail = async (user: User) => {
  const token = generateJWT(user.id, user.email);
  const url = `${process.env.BASE_URI}users/${user.id}/verify/${token}`;
  console.log(user.email);
  const emailData = {
    from: "noreply@node-react.com",
    to: user.email,
    subject: "Email Verification Instructions",
    text: `Hello ${user.name}, Please use the below link to Verify your email: ${url}`,
    html: `<p>Please use the following link to verify your Email:</p> 
            <p>${url} </p>`,
  };
  sendEmail(emailData);
}

export const auth = async (req: Request, res: Response, next: e.NextFunction) => {
  const cookieToken = req.cookies["voicex-auth-token"];
  if (!cookieToken) {
    return res.status(401).json({
      error: "Unauthorized, no cookie",
    });
  }

  const valid = decodeJWT(cookieToken);
  if (!valid) {
    return res.status(401).json({
      error: "Unauthorized, Invalid Token",
    });
  }

  next();
}


export const signUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    let user = await findUserByEmail(email);
    if (user) {
      throw new Error("User with email already exist");
    }

    user = newUser(name, email, password);
    await createUser(user);

    await sendVerificationEmail(user);
    res
      .status(200)
      .send({ message: "An Email sent to your account please verify" });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json(error.message);
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User with email does not exist.Please SignUp");
    }

    //Make sure the user email is validated
    if (!user.verified) {
      await sendVerificationEmail(user);
      throw new Error("Please verify your email to login");
    }

    if (!authenticate(user.id || "", password, user.password)) {
      throw new Error("Email and password do not match");
    }

    const token = generateJWT(user.id || "", user.email);
    const { id, name } = user;

    res.cookie("voicex-auth-token", token, cookieOptions);

    res.status(200).json({ id, name, email });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json(error.message);
  }
};

export const signOut = (req: Request, res: Response) => {
  res.clearCookie("voicex");
  return res.json("Sign Out success!");
};


export const socialLogin = async (req: Request, res: Response) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const idToken = req.body.tokenId;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name }: any = ticket.getPayload();

    let user = await findUserByEmail(email);
    if (!user) {
      // create a new user and login
      user = newUser(name, email, "123456");
      await createUser(user);
    }

    const token = generateJWT(user.id, user.email);

    res.cookie("voicex-auth-token", token, cookieOptions);
    return res.json({ id: user.id, name, email });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json(error.message);
  }
};


export const VerifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new Error("Token not found");
    }

    const verified = decodeJWT(token);
    if (!verified) {
      throw new Error("Invalid Token");
    }

    const { id, email } = verified;
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.verified) {
      throw new Error("User already verified");
    }

    user.verified = true;
    await createUser(user);

    const authToken = generateJWT(user.id, user.email);
    res.cookie("voicex-auth-token", authToken, cookieOptions);

    return res.json({ id: user.id, name: user.name, email: user.email });

  } catch (error: any) {
    console.log(error);
    return res.status(400).json(error.message);
  }
}
