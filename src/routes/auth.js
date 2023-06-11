import { Router } from "express";
import { signUp, signIn, socialLogin } from "../controllers/auth.js";

//import password reset validator
import {
  userSignUpValidator,
  userSignInValidator,
} from "../validator/index.js";
// const {userById} = require('../controllers/user');

const Auth = Router();

Auth.post("/signUp", userSignUpValidator, signUp);
Auth.post("/signIn", userSignInValidator, signIn);

// password forgot and reset routes
// Auth.put('/forgot-password', forgotPassword);
// Auth.put('/reset-password', passwordResetValidator, resetPassword);

// //Verify email
Auth.get("/:id/verify/:token/", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });
    await user.updateOne({ _id: user._id, verified: true });
    await token.remove();
    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});
// Auth.get("/:id/verify/:token/",verifyEmail);

// then use this route for social login
Auth.post("/social-login", socialLogin);

// // any route containing :userId, our app will first execute userByID()
// Auth.param('userId', userById);

export default Auth;
