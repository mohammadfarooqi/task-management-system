# API Testing Documentation

## Authentication Update - HttpOnly Cookies

The authentication system has been updated to use **HttpOnly cookies** for enhanced security against XSS attacks. Here's what you need to know:

### How It Works Now

1. **Login**: When you login via `/api/auth/login`, the JWT token is set as an HttpOnly cookie named `accessToken`
2. **Subsequent Requests**: The cookie is automatically included in requests from browsers and REST clients that support cookies
3. **Logout**: The `/api/auth/logout` endpoint clears the cookie

### Using the .http Files

#### Option 1: Cookie-Based Authentication (Recommended)
If your REST client supports cookies (like VS Code REST Client with cookie support enabled):
1. Execute any login request first
2. The cookie will be automatically set and sent with subsequent requests
3. You can remove the `Authorization: Bearer` headers

#### Option 2: Bearer Token Authentication (Fallback)
The API still supports Bearer tokens as a fallback for testing tools without cookie support:
1. Login and copy the token from the browser's cookies or from a tool that shows response cookies
2. Add the `Authorization: Bearer YOUR_TOKEN` header to requests
3. This is what the current .http files use

### VS Code REST Client Setup

To enable cookie support in VS Code REST Client:
1. Install the "REST Client" extension by Huachao Mao
2. Add to your VS Code settings.json:
```json
{
  "rest-client.enableCookies": true
}
```

### Testing with curl

```bash
# Login (saves cookies to file)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.com","password":"password123"}'

# Use cookies for authenticated requests
curl -b cookies.txt http://localhost:3000/api/tasks

# Logout (clears cookie)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

### Testing with Postman

1. Postman automatically handles cookies
2. After login, cookies are stored in the Cookies tab
3. Subsequent requests will include the cookie automatically
4. Make sure "Cookie Jar" is enabled in Settings

### Security Benefits

- **XSS Protection**: JavaScript cannot access HttpOnly cookies, preventing token theft via XSS
- **CSRF Protection**: Cookies use `SameSite=strict` to prevent CSRF attacks
- **Secure Flag**: In production, cookies use the `Secure` flag (HTTPS only)
- **Auto-Expiry**: Cookies expire after 24 hours, matching JWT expiration

### Backward Compatibility

The API maintains backward compatibility:
- Bearer tokens in Authorization headers still work
- This allows testing tools without cookie support to continue functioning
- The auth guard checks cookies first, then falls back to Authorization header

### Important Notes

- The Angular dashboard automatically uses cookies via the HTTP interceptor
- The `accessToken` is no longer returned in the login response body
- The token is no longer stored in localStorage on the frontend
- All API endpoints that require authentication work with both cookies and Bearer tokens