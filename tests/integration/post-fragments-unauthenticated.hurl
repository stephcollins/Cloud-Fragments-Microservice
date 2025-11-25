# POST /v1/fragments without authentication should return 401 Unauthorized

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This should not be allowed`

HTTP/1.1 401
