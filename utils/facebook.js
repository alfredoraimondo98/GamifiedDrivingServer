var userDati;

//fb
const passport = require("passport")
const FacebookStrategy = require("passport-facebook").Strategy

//


  passport.serializeUser(function(user, done) {
    done(null, user)
    
  })
  passport.deserializeUser(function(user, done) {
    done(null, user)
  })

var logFunction;
  passport.use(
    new FacebookStrategy(
        //Dati API SmartDriving
      {
        clientID: "372413867105333",
        clientSecret: "7deb65907639b13ac4675b120b36f1b5",
        callbackURL: "http://localhost:3000/auth/facebook/callback", //Route da richiamare in seguito al login con facebook
    },
    
    logFunction = (accessToken, refreshToken, profile, cb) => {
         // console.log("profilo" , profile);
         userDati = {
            'email': profile.email,
            'name' : profile.displayName,
            'id'   : profile.id,
            'token': accessToken,
             
        }
        console.log("userDati", userDati);
         return cb(null, profile)
      }
    )

  )

  exports.datifb = () => {
    return userDati;
  }

//module.exports = logFunction;