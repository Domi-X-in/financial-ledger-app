// server/config/passport.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "your_jwt_secret",
};

module.exports = (passport) => {
  // JWT Strategy
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // Updated to use jwt_payload.user.id instead of jwt_payload.id
        const user = await User.findById(jwt_payload.user.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (err) {
        console.error("JWT strategy error:", err);
        return done(err, false);
      }
    })
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Create new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          console.error(err);
          return done(err, false);
        }
      }
    )
  );
};