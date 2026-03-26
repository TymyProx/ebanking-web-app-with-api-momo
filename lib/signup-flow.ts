/** Durée commune : OTP, cookie session d’inscription, lien e-mail de vérification */
export const SIGNUP_STEP_TTL_MS = 5 * 60 * 1000

export const SIGNUP_STEP_TTL_MINUTES = SIGNUP_STEP_TTL_MS / 60_000

/** maxAge cookie `pending_signup_data` (secondes), aligné sur SIGNUP_STEP_TTL_MS */
export const SIGNUP_PENDING_COOKIE_MAX_AGE_SEC = Math.ceil(SIGNUP_STEP_TTL_MS / 1000)
