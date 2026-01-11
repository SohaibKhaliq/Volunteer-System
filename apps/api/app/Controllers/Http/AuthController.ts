import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

import User from '../../Models/User'
import Organization from '../../Models/Organization'
import AuditLog from '../../Models/AuditLog'
import UserPreference from '../../Models/UserPreference'
import Role from '../../Models/Role'

export default class AuthController {
  /**
   * User Registration Flow
   * Steps:
   * 1. Validate input (email, password, name)
   * 2. Check duplicate email
   * 3. Hash password (handled by model beforeSave hook)
   * 4. Create user record
   * 5. Assign default role = volunteer
   * 6. Create default preferences
   * 7. Generate access token
   * 8. Return user + token
   *
   * @route POST /register
   * @tags Authentication
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {
   *         "type": "object",
   *         "required": ["email", "password", "firstName", "lastName"],
   *         "properties": {
   *           "email": {"type": "string", "format": "email", "example": "john@example.com"},
   *           "password": {"type": "string", "minLength": 8, "example": "SecurePass123", "description": "Min 8 chars, must include uppercase, lowercase, and digit"},
   *           "firstName": {"type": "string", "example": "John"},
   *           "lastName": {"type": "string", "example": "Doe"},
   *           "role": {"type": "string", "enum": ["volunteer", "organization"], "example": "volunteer"},
   *           "phone": {"type": "string"},
   *           "address": {"type": "string"},
   *           "description": {"type": "string"}
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 201 {
   *   "token": {
   *     "type": "bearer",
   *     "token": "eyJhbGc...",
   *     "expires_at": "2024-01-01T00:00:00.000Z"
   *   },
   *   "user": {
   *     "id": 1,
   *     "email": "john@example.com",
   *     "firstName": "John",
   *     "lastName": "Doe"
   *   },
   *   "message": "Registration successful"
   * }
   * @response 400 {"error": {"message": "Validation failed", "details": {}}}
   * @response 409 {"error": {"message": "Email already registered", "field": "email"}}
   */
  public async register({ request, response, auth }: HttpContextContract) {
    try {
      const { role, name, phone, address, description, ...userData } = request.all()

      // Step 1 & 2: Validate input and check duplicate email
      const userSchema = schema.create({
        email: schema.string({ trim: true }, [
          rules.email(),
          rules.unique({ table: 'users', column: 'email', caseInsensitive: true })
        ]),
        password: schema.string({}, [
          rules.minLength(8),
          rules.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        ]),
        firstName: schema.string({ trim: true }),
        lastName: schema.string({ trim: true })
      })

      const validatedData = await request.validate({ schema: userSchema })

      // Step 3 & 4: Hash password and create user record
      const user = await User.create({
        ...validatedData,
        volunteerStatus: 'active',
        isDisabled: false
      })

      // Step 5: Assign default role = volunteer
      const volunteerRole = await Role.findBy('name', 'volunteer')
      if (volunteerRole) {
        await user.related('roles').attach([volunteerRole.id])
      }

      // Step 6: Create default preferences
      await UserPreference.create({
        userId: user.id,
        ...UserPreference.getDefaults()
      })

      // If registering as an organization, create the organization record
      if (role === 'organization') {
        await Organization.create({
          name: name || `${validatedData.firstName || ''} ${validatedData.lastName || ''}`.trim(),
          description: description || null,
          contactEmail: validatedData.email,
          contactPhone: phone || null,
          address: address || null,
          ownerId: user.id,
          status: 'pending',
          isApproved: false,
          isActive: false
        })

        // Log registration
        await AuditLog.safeCreate({
          userId: user.id,
          action: 'register',
          details: 'Organization registration submitted for approval',
          ipAddress: request.ip()
        })

        // Step 7: Generate access token
        const token = await auth.use('api').generate(user)

        // Step 8: Return user + token
        return response.created({
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          message: 'Organization registration submitted for approval',
          status: 'pending'
        })
      }

      // Log successful registration
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'register',
        details: 'User registered successfully',
        ipAddress: request.ip()
      })

      // Step 7: Generate access token
      const token = await auth.use('api').generate(user)

      // Step 8: Return user + token
      return response.created({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          volunteerStatus: user.volunteerStatus
        },
        message: 'Registration successful'
      })
    } catch (error) {
      Logger.error('Registration error:', error)

      // Handle validation errors
      if (error.messages) {
        return response.badRequest({
          error: {
            message: 'Validation failed',
            details: error.messages
          }
        })
      }

      // Edge case: Duplicate email (caught by unique constraint)
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        return response.conflict({
          error: {
            message: 'Email already registered',
            field: 'email'
          }
        })
      }

      // Edge case: Weak password
      return response.badRequest({
        error: {
          message: 'Unable to register',
          details: error.message
        }
      })
    }
  }

  /**
   * User Login Flow
   * Steps:
   * 1. Validate credentials
   * 2. Verify password hash
   * 3. Generate access token
   * 4. Save token to DB (handled by auth.attempt)
   * 5. Update last active timestamp
   * 6. Return token + user
   *
   * @route POST /login
   * @tags Authentication
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {
   *         "type": "object",
   *         "required": ["email", "password"],
   *         "properties": {
   *           "email": {"type": "string", "format": "email", "example": "john@example.com"},
   *           "password": {"type": "string", "example": "SecurePass123"}
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 200 {
   *   "token": {"type": "bearer", "token": "eyJhbGc...", "expires_at": "2024-01-01T00:00:00.000Z"},
   *   "user": {"id": 1, "email": "john@example.com", "firstName": "John", "lastName": "Doe", "roles": ["volunteer"]},
   *   "message": "Login successful"
   * }
   * @response 401 {"error": {"message": "Invalid credentials"}}
   * @response 403 {"error": {"message": "Account has been disabled"}}
   */
  public async login({ request, response, auth }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.badRequest({
        error: { message: 'Email and password are required' }
      })
    }

    try {
      // Step 1 & 2: Validate credentials and verify password
      const user = await User.findBy('email', email)

      // Check if user exists
      if (!user) {
        await AuditLog.safeCreate({
          userId: null,
          action: 'login_failed',
          details: `Login attempt for non-existent email: ${email}`,
          ipAddress: request.ip()
        })

        return response.unauthorized({
          error: { message: 'Invalid credentials' }
        })
      }

      // Check if user is disabled
      if (user.isDisabled) {
        await AuditLog.safeCreate({
          userId: user.id,
          action: 'login_failed',
          details: 'Login attempt for disabled account',
          ipAddress: request.ip()
        })

        return response.forbidden({
          error: { message: 'Account has been disabled. Please contact support.' }
        })
      }

      // Step 3 & 4: Generate access token and save to DB
      const token = await auth.use('api').attempt(email, password)

      // Step 5: Update last active timestamp
      user.lastLoginAt = DateTime.now()
      await user.save()

      // Log successful login
      await AuditLog.logLogin(user.id, true, request.ip())

      // Load user roles and preferences
      await user.load('roles')
      const preferences = await UserPreference.getForUser(user.id)

      // Step 6: Return token + user
      return response.ok({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          volunteerStatus: user.volunteerStatus,
          roles: user.roles.map((r) => r.name),
          preferences: {
            language: preferences.language,
            timezone: preferences.timezone,
            theme: preferences.theme
          }
        },
        message: 'Login successful'
      })
    } catch (error) {
      Logger.error('Login error:', error)

      // Log failed login attempt if user exists
      const user = await User.findBy('email', email)
      if (user) {
        await AuditLog.logLogin(user.id, false, request.ip())
      }

      return response.unauthorized({
        error: { message: 'Invalid credentials' }
      })
    }
  }

  /**
   * Logout Flow
   * Steps:
   * 1. Revoke token in DB
   * 2. Clear session/cache
   * 3. Return success
   *
   * @route POST /logout
   * @tags Authentication
   * @security bearerAuth: []
   * @response 200 {"message": "Logout successful"}
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async logout({ request, response, auth }: HttpContextContract) {
    try {
      // Capture user ID before revoking
      const user = auth.use('api').user

      // Step 1: Revoke token in DB
      await auth.use('api').revoke()

      if (user) {
        // Log logout activity
        await AuditLog.safeCreate({
          userId: user.id,
          action: 'logout',
          details: 'User logged out',
          ipAddress: request.ip()
        })
      }

      // Step 2 & 3: Clear session/cache and return success
      return response.ok({
        message: 'Logout successful'
      })
    } catch (error) {
      Logger.error('Logout error:', error)
      return response.badRequest({
        error: { message: 'Unable to logout' }
      })
    }
  }

  /**
   * Get current authenticated user
   *
   * @route GET /me
   * @tags Authentication
   * @security bearerAuth: []
   * @response 200 {
   *   "user": {
   *     "id": 1,
   *     "email": "john@example.com",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "isAdmin": false,
   *     "volunteerStatus": "active",
   *     "roles": [{"id": 1, "name": "volunteer", "description": "Default volunteer role"}],
   *     "preferences": {"language": "en", "timezone": "Australia/Sydney", "theme": "light"}
   *   }
   * }
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async me({ response, auth }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      await user.load('roles')
      const preferences = await UserPreference.getForUser(user.id)

      return response.ok({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isAdmin: user.isAdmin,
          volunteerStatus: user.volunteerStatus,
          emailVerifiedAt: user.emailVerifiedAt,
          lastLoginAt: user.lastLoginAt,
          roles: user.roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description
          })),
          preferences: {
            language: preferences.language,
            timezone: preferences.timezone,
            theme: preferences.theme,
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications
          }
        }
      })
    } catch (error) {
      Logger.error('Get user error:', error)
      return response.internalServerError({
        error: { message: 'Unable to fetch user data' }
      })
    }
  }

  /**
   * Refresh token
   *
   * @route POST /refresh
   * @tags Authentication
   * @security bearerAuth: []
   * @response 200 {"token": {"type": "bearer", "token": "new_jwt_token...", "expires_at": "2024-01-01T00:00:00.000Z"}, "message": "Token refreshed successfully"}
   * @response 401 {"error": {"message": "Unable to refresh token"}}
   */
  public async refresh({ response, auth }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      // Revoke current token
      await auth.use('api').revoke()

      // Generate new token
      const token = await auth.use('api').generate(user)

      return response.ok({
        token,
        message: 'Token refreshed successfully'
      })
    } catch (error) {
      Logger.error('Token refresh error:', error)
      return response.unauthorized({
        error: { message: 'Unable to refresh token' }
      })
    }
  }
}
