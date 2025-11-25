# POST /v1/fragments with an unsupported Content-Type should return 415

POST http://localhost:8080/v1/fragments
Content-Type: application/x-unknown
[BasicAuth]
user1@email.com:password1
`This content type is not supported`

HTTP/1.1 415
