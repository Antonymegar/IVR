import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendEmail } from "../helpers/index.js";
import { OAuth2Client } from "google-auth-library";
import e, { Request, Response } from "express";
import { User, authenticate, createUser, findUserByEmail, findUserById, hashPassword, newUser, updateUser } from "../models/user.js";
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
  const url = `${process.env.WEB_APP_URL}/auth/verify?token=${token}`;
  const emailData = {
    from: "noreply@node-react.com",
    to: user.email,
    subject: "Email Verification Instructions",
    text: `Hello ${user.name}, Please use the below link to Verify your email: ${url}`,
    html: `
      <p>Hello ${user.name}, </p>
      <p>Please use the following link to verify your Email: </p> 
      <p>${url} </p>
    `,
  };
  sendEmail(emailData);
}

const sentPasswordResetEmail = async (user: User) => {
  const token = generateJWT(user.id, user.email);
  const url = `${process.env.WEB_APP_URL}/auth/change-password?token=${token}`;
  console.log(user.email);
  const emailData = {
    from: "noreply@node-react.com",
    to: user.email,
    subject: "Password Reset Instructions",
    text: `Hello ${user.name}, You requested for password reset, Please use the below link to reset your password: ${url}`,
    html: `
      <p>Hello ${user.name}</p>,
      <p>You requested for password reset, Please use the below link to reset your password: </p>
      <p>${url}</p>
      <p>Please ignore this email if you did not request to change password</p>
    `,
  };
  sendEmail(emailData);
}

export const auth = async (req: Request, res: Response, next: e.NextFunction) => {
  try {
    const cookieToken = req.cookies["voicex-auth-token"];
    if (!cookieToken) {
      throw new Error("Unauthorized, no cookie");
    }

    const valid = decodeJWT(cookieToken);
    if (!valid) {
      throw new Error("Unauthorized, Invalid Token");
    }

    next();
  } catch (error: any) {
    console.log(error);
    res.status(401).send(error.message);
  }
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
    res.send({ message: "An Email sent to your account please verify" });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
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

    if (!authenticate(user.id, password, user.password)) {
      throw new Error("Email and password do not match");
    }

    const token = generateJWT(user.id, user.email);
    const { id, name } = user;

    res.cookie("voicex-auth-token", token, cookieOptions);

    res.send({ id: user.id, name: user.name, email: user.email });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("User with email does not exist.Please SignUp");
    }
    sentPasswordResetEmail(user);
    res.send({ message: "Check email for password reset link" });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const payload = decodeJWT(token);
    if (!payload) {
      throw new Error("Invalid Token");
    }

    const { id } = payload;
    const user = await findUserById(id);
    if (!user) {
      throw new Error("User does not exist");
    }

    user.password = hashPassword(user.id, newPassword)
    await updateUser(user);
    res.send({ message: "Password changed successfully" });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export const signOut = (req: Request, res: Response) => {
  res.clearCookie("voicex");
  res.send("Sign Out success!");
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
    res.send({ id: user.id, name: user.name, email: user.email });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
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
    await updateUser(user);

    const authToken = generateJWT(user.id, user.email);
    res.cookie("voicex-auth-token", authToken, cookieOptions);

    res.send({ id: user.id, name: user.name, email: user.email });

  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
