const express = require('express');

const {signup, signin, forgotPassword, resetPassword, socialLogin, verifyEmail } = require('../controllers/auth');

//import password reset validator
const {userSignupValidator,passwordResetValidator, userSigninValidator} = require('../validator');
// const {userById} = require('../controllers/user');

const router = express.Router();

router.post('/signup', userSignupValidator, signup);
router.post('/signin',userSigninValidator, signin);



// password forgot and reset routes
// router.put('/forgot-password', forgotPassword);
// router.put('/reset-password', passwordResetValidator, resetPassword);

// //Verify email
router.get("/:id/verify/:token/",async (req,res)=>{
    try {
        const user= await User.findOne({_id: req.params.id});
        if(!user) return res.status(400).send({message: "Invalid link"});

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,

        });
        if(!token) return res.status(400).send({message: "Invalid link"});
        await User.updateOne({_id:user._id , verified: true});
        await token.remove();
        res.status(200).send({ message: "Email verified successfully" });
    }
    catch(error){
       res.status(500).send({message: "Internal Server Error"})
    }


});
// router.get("/:id/verify/:token/",verifyEmail);

// then use this route for social login
router.post('/social-login', socialLogin);

// // any route containing :userId, our app will first execute userByID()
// router.param('userId', userById);

module.exports= router;