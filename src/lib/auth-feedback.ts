export type AuthField = 'email' | 'password' | 'firstName' | 'surname'

export type AuthFieldErrors = Partial<Record<AuthField, string>>

export interface AuthFeedbackResult {
  formError?: string
  fieldErrors?: AuthFieldErrors
  toastMessage: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeMessage(error: unknown) {
  if (error instanceof Error) return error.message.trim()
  if (typeof error === 'string') return error.trim()
  return ''
}

function includesAny(message: string, terms: string[]) {
  return terms.some((term) => message.includes(term))
}

export function validateEmail(email: string) {
  return EMAIL_REGEX.test(email)
}

export function getSignInFieldErrors(values: { email: string; password: string }): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const email = values.email.trim()
  const password = values.password

  if (!email) errors.email = 'Enter the email address you used for your account.'
  else if (!validateEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.'

  if (!password) errors.password = 'Enter your password to continue.'

  return errors
}

export function getSignUpFieldErrors(values: {
  firstName: string
  surname: string
  email: string
  password: string
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const firstName = values.firstName.trim()
  const surname = values.surname.trim()
  const email = values.email.trim()
  const password = values.password

  if (!firstName) errors.firstName = 'Enter your first name.'
  if (!surname) errors.surname = 'Enter your surname.'

  if (!email) errors.email = 'Enter your email address so we can create your account.'
  else if (!validateEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.'

  if (!password) errors.password = 'Create a password to secure your account.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters for your password.'

  return errors
}

export function getFriendlyAuthError(error: unknown, mode: 'signIn' | 'signUp'): AuthFeedbackResult {
  const rawMessage = normalizeMessage(error)
  const message = rawMessage.toLowerCase()

  if (includesAny(message, ['network', 'fetch', 'failed to fetch', 'connection'])) {
    return {
      formError: 'We could not reach the server. Check your connection and try again.',
      toastMessage: 'Connection problem. Please try again.',
    }
  }

  if (mode === 'signIn') {
    if (includesAny(message, ['invalid password', 'invalid credentials', 'incorrect password', 'wrong password'])) {
      return {
        formError: 'That email and password combination did not match our records.',
        fieldErrors: {
          password: 'Double-check your password and try again.',
        },
        toastMessage: 'Incorrect email or password.',
      }
    }

    if (includesAny(message, ['user not found', 'account not found', 'no user'])) {
      return {
        formError: 'We could not find an account with that email address.',
        fieldErrors: {
          email: 'Check the email address or create a new account.',
        },
        toastMessage: 'Account not found.',
      }
    }
  }

  if (mode === 'signUp') {
    if (includesAny(message, ['already exists', 'already registered', 'duplicate', 'unique', 'account exists'])) {
      return {
        formError: 'An account with that email already exists. Try signing in instead.',
        fieldErrors: {
          email: 'This email is already in use.',
        },
        toastMessage: 'Email already registered.',
      }
    }

    if (includesAny(message, ['password', 'too short', 'at least 6'])) {
      return {
        formError: 'Your password needs a little more strength before we can create the account.',
        fieldErrors: {
          password: 'Use at least 6 characters for your password.',
        },
        toastMessage: 'Password is too short.',
      }
    }
  }

  if (includesAny(message, ['email']) && includesAny(message, ['invalid', 'format'])) {
    return {
      formError: 'That email address does not look valid yet.',
      fieldErrors: {
        email: 'Enter a valid email address, like name@example.com.',
      },
      toastMessage: 'Email address needs attention.',
    }
  }

  return {
    formError:
      mode === 'signIn'
        ? 'We could not sign you in right now. Please review your details and try again.'
        : 'We could not create your account right now. Please review your details and try again.',
    toastMessage:
      mode === 'signIn'
        ? 'Sign-in failed. Please try again.'
        : 'Sign-up failed. Please try again.',
  }
}
