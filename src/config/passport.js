import passport from "passport";
import {
    Strategy as GoogleStrategy
} from "passport-google-oauth20";

import User from "../models/userModel.js";

passport.use(
    new GoogleStrategy(
        {
            clientID:
                process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env.GOOGLE_REDIRECT_URI
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {
            try {
                const providerId =
                    profile.id;

                const email =
                    profile.emails?.[0]?.value
                        ?.trim()
                        .toLowerCase();

                const name =
                    profile.displayName ||
                    profile.name?.givenName ||
                    "Google User";

                if (!email) {
                    return done(
                        new Error(
                            "Google account does not provide an email"
                        ),
                        null
                    );
                }

                let user =
                    await User.findOne({
                        $or: [
                            {
                                providerId
                            },
                            {
                                email
                            }
                        ]
                    });

                if (!user) {
                    return done(
                        new Error(
                            "No account found. Please register first."
                        ),
                        null
                    );
                }

                if (!user.isActive) {
                    return done(
                        new Error(
                            "User account is inactive"
                        ),
                        null
                    );
                }

                if (!user.providerId) {
                    user.providerId =
                        providerId;

                    await user.save({
                        validateBeforeSave:
                            false
                    });
                }

                if (
                    user.name ===
                        undefined ||
                    !user.name
                ) {
                    user.name =
                        name;

                    await user.save({
                        validateBeforeSave:
                            false
                    });
                }

                return done(
                    null,
                    user
                );

            } catch (error) {
                return done(
                    error,
                    null
                );
            }
        }
    )
);

export default passport;