const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { check,body } = require("express-validator");
// const csrf = require("../middleWare/csurf");

router.get("/login", authController.getLogin);

router.post("/login",[body('email').isEmail().withMessage("لطفا ایمیل معتبری را وارد کنید")],

authController.postLogin);

router.post("/logout", authController.postLogout);

router.get("/signup", authController.getSignup);

router.post("/signup", [check("email").isEmail().withMessage("لطفا ایمیل معتبری را وارد کنید"),
body('confirmPassword').custom((value,{req})=>{
if(value !== req.body.password){
    throw new Error('رمز عبور با تکرار آن همخوانی ندارد');
}
return true;
})
,
body("password","لطفا رمزی را وارد کنید که حداقل دارای 5 کاراکتر و ترکیبی از اعداد و حروف باشد... ").isLength({min:5}).isAlphanumeric()
],authController.postSignup);

router.get("/reset", authController.getReset);

router.post("/reset",body('email').isEmail().withMessage('لطفا ایمیل معتبری را وارد کنید') ,authController.postReset);

router.get("/reset/:token", authController.getResetPassword);

router.post("/reset-password",body("password").isLength({min:5}).isAlphanumeric().withMessage('لطفا رمزی وارد کنید که دارای حداقل 5 کاراکتر و دارای اعداد و حروف باشد .')
, authController.postResetPassword);

router.get('/waitPage',authController.getWaitPage);

router.get('/Edit-User',authController.getEditUser);

router.post('/Edit-UserInfo', check("email").isEmail().withMessage("لطفا ایمیل معتبری را وارد کنید"),authController.postEditUser);

module.exports = router;
