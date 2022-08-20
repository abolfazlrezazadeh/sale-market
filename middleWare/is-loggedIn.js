// middle ware that if client dont logged in redirect it to login page

module.exports = (req,res,next)=>{
    if(!req.session.user){
        return res.redirect('/login')
    }
    next();
}