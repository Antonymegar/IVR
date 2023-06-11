import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";
import crypto from "crypto";
import { sendEmail } from "../helpers/index.js";
import Token from "../models/token.js";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

export const signUp = async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(403).json({
        error: "Email is taken!",
      });

    user = await new User(req.body).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const url = `${process.env.BASE_URI}users/${user.id}/verify/${token.token}`;
    const emailData = {
      from: "noreply@node-react.com",
      to: user.email,
      subject: "Email Verification Instructions",
      text: `Hello ${user.name}, Please use the below link to Verify your email: ${url}`,
      html: `<p>Please use the following link to verify your Email:</p> 
            <p>${url} </p>`,
    };

    await sendEmail(emailData);
    res
      .status(201)
      .send({ message: "An Email sent to your account please verify" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "internal Server Error" });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  // if err or no user
  if (!user) {
    return res.status(401).json({
      err: "User with email does not exist.Please SignUp",
    });
  }
  // if user is found make sure the email and password match
  // create authenticate method in model and use here
  if (!user.authenticate(password)) {
    return res.status(401).json({
      error: "Email and password do not match",
    });
  }
  //Make sure the user email is validated
  if (!user.verified) {
    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URI}users/${user.id}/verify/${token.token}`;
      console.log(user.email);
      const emailData = {
        from: "noreply@node-react.com",
        to: user.email,
        subject: "Email Verification Instructions",
        text: `Hello ${user.name}, Please use the below link to Verify your email: ${url}`,
        html: `<p>Please use the following link to verify your Email:</p> 
            <p>${url} </p>`,
      };
      await sendEmail(emailData);
    }
    return res.status(400).send({
      message:
        " You have not verified your Email, An Email sent to your account please verify !",
    });
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  const { _id, name } = user;
  return res.json({ token, user: { _id, email, name } });
};

export const signOut = (req, res) => {
  res.clearCookie("t");
  return res.json({ message: "Signout success!" });
};

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

export const socialLogin = async (req, res) => {
  const idToken = req.body.tokenId;
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  });
  // console.log('ticket', ticket);
  const {
    email_verified,
    email,
    name,
    picture,
    sub: googleid,
  } = ticket.getPayload();

  if (email_verified) {
    console.log(`email_verified > ${email_verified}`);
    const newUser = { email, name, password: googleid };
    // try signUp by finding user with req.email and if user doesnot exist save
    User.findOne({ email }, (err, user) => {
      if (err || !user) {
        // create a new user and login
        user = new User(newUser);
        req.profile = user;
        user.save();
        // generate a token with user id and secret
        const token = jwt.sign(
          { _id: user._id, iss: process.env.APP_NAME },
          process.env.JWT_SECRET
        );
        res.cookie("t", token, { expire: new Date() + 9999 });
        // return response with user and token to frontend client
        const { _id, name, email } = user;
        return res.json({ token, user: { _id, name, email } });
      } else {
        //update existing user with new  social info and login
        req.profile = user;
        user = _.extend(user, newUser);
        user.updated = Date.now();
        user.save;
      }
      // generate a token with user id and secret
      const token = jwt.sign(
        { _id: user._id, iss: process.env.APP_NAME },
        process.env.JWT_SECRET
      );
      res.cookie("t", token, { expire: new Date() + 9999 });
      // return response with user and token to frontend client
      const { _id, name, email } = user;
      return res.json({ token, user: { _id, name, email } });
    });
  }
};
