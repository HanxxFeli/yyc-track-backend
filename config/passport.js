/**
 * Passport Configuration
 * 
 * Configures Google OAuth strategy
 * Handles OAuth authentication flow
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Configure Google OAuth Strategy
 */
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        async (accessToken, refreshToken, profile, done) => { 
            try { 
                // extract user information from google profile
                const email = profile.emails[0].value;
                const firstName = profile.name.givenName;
                const lastName = profile.name.familyName;
                const googleId = profile.id;
                const profilePicture = profile.photos[0]?.value;

                // check if user already exists
                let user = await User.findOne({ email })

                if (user) { 
                    // if user exists - check authMethod
                    if (user.authMethod == 'local') { 
                        // link google account if user registered with local
                        user.googleId = googleId;
                        user.authMethod = 'google';
                        user.profilePicture = profilePicture;
                        user.isEmailVerified = true;
                        await user.save(); // save and update using mongoose
                    }

                    // if user is already using google auth
                    return done(null, user) // no error occured and user obj is authenticated
                }

                // if user doesnt exist yet - create new user
                user = await User.create({
                    firstName,
                    lastName,
                    email,
                    googleId,
                    authMethod: 'google',
                    profilePicture,
                    isEmailVerified: true,
                    // postalCode to be collected after redirect
                });

                return done(null, user) // complete new user creation
            }
            catch (error) { 
                console.error(`Google OAuth error: ${error}`);
                return done(error, null);
            }
        }
    )
)

/**
 * Serialize user for session
 * Stores only the user ID in the session
 */
passport.serializeUser((user, done) => { 
    done(null, user._id)
})

/**
 * Deserialize user from session
 * Use the stored ID from serializeUser to fetch full user object for each request
 */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } 
    catch (error) { 
        done(error, null);
    }
});

module.exports = passport;