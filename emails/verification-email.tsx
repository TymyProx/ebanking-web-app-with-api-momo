[E-banking Middleware]
Is
auth
page: true
\
[E-banking Middleware] Is accept-invite page: false
[E-banking Middleware] Allowing request to proceed
[v0] Starting signup process...
[v0] Step 1: Creating auth account via /auth/sign-up...
[v0] Signup payload:
{
  "email\":\"mohamedyacinetou@gmail.com","password\":"***",\"tenantId\":\"aa1287f6-06af-45b7-a905-8c57363565c2"
}
\
[v0] Signup response status: 200
[v0] Signup response body: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhMTUxZjRlLTk4MTUtNGI3OS1hZTljLWJmYzhhNjRiYWI4YyIsImlhdCI6MTc2MTc1Mzk2OSwiZXhwIjoxNzYyMzU4NzY5fQ.nmvg38nxZOs2ZQVZBJ8JQoUkLFkDHZDknBjgSPL9E5c...
[v0] Received JWT token directly
[v0] Auth account created successfully
[v0] Step 2: Sending email verification via Resend...
 ○ Compiling /api/send-verification-email ...
 ⨯ ./app/api/send-verification-email/route.ts:2:1
Module not found: Can't resolve 'resend'
\
  1 |
\
> 2 |
\
    | ^
  3 |
  4 |
const resend = new Resend(process.env.RESEND_API_KEY)
5 |
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bng@astratechnologie.com"

https: //nextjs.org/docs/messages/module-not-found
⨯ ./app/api/send-verification-email/route.ts:2:1
Module not found: Can't resolve 'resend'
\
  1 |
\
> 2 |
| ^
\
  3 |
  4 |
const resend = new Resend(process.env.RESEND_API_KEY)
5 |
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bng@astratechnologie.com"

https: //nextjs.org/docs/messages/module-not-found
⨯ ./app/api/send-verification-email/route.ts:2:1
Module not found: Can't resolve 'resend'
\
  1 |
\
> 2 |
import { Resend } from "resend"
| ^
\
  3 |
  4 |
const resend = new Resend(process.env.RESEND_API_KEY)
5 |
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bng@astratechnologie.com"

https: //nextjs.org/docs/messages/module-not-found
\
 POST /api/send-verification-email 500 in 17087ms
[v0] Email API response status: 500
[v0] Signup error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
    at JSON.parse (<anonymous>)
    at async signupUser (app\signup\actions.ts:143:30)
  141 |
  142 |     console.log("[v0] Email API response status:", emailResponse.status)
> 143 |
const emailResponseData =
  (await emailResponse.json()) |
  ^
\
144 | console.log("[v0] Email API response:", emailResponseData)
145 |
  146 |
if (!emailResponse.ok) {
\
 POST /signup 200 in 19235ms
[E-banking Middleware] Pathname: /signup
[E-banking Middleware] Has token: false
[E-banking Middleware] Is auth page: true
[E-banking Middleware] Is accept-invite page: false
[E-banking Middleware] Allowing request to proceed
 GET /signup 500 in 194ms
[E-banking Middleware] Pathname: /signup
[E-banking Middleware] Has token: false
[E-banking Middleware] Is auth page: true
[E-banking Middleware] Is accept-invite page: false
[E-banking Middleware] Allowing request to proceed
 GET /signup 500 in 105ms
[E-banking Middleware] Pathname: /signup
[E-banking Middleware] Has token: false
[E-banking Middleware] Is auth page: true
[E-banking Middleware] Is accept-invite page: false
[E-banking Middleware] Allowing request to proceed
 GET /signup 500 in 37ms
[E-banking Middleware] Pathname: /signup
[E-banking Middleware] Has token: false
[E-banking Middleware] Is auth page: true
[E-banking Middleware] Is accept-invite page: false
[E-banking Middleware] Allowing request to proceed
 GET /signup 500 in 32ms
