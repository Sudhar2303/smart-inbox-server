import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback , StrategyOptions} from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

interface ExtendedGoogleStrategyOptions extends StrategyOptions {
  accessType?: string;
  prompt?: string;
}

const options: ExtendedGoogleStrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
  accessType: "offline",
  prompt: "consent",
}

passport.use(
  new GoogleStrategy(options, (accessToken, refreshToken, profile, done) => {
    return done(null, { profile, accessToken, refreshToken });
  })
);

export default passport;
