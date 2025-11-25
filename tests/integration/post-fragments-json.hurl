# tests/integration/post-fragments-json.hurl
# Confirm that posting JSON fragments is NOT supported
# and returns 415 Unsupported Media Type

POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"message":"hello world"}`

# Expect failure (JSON not supported)
HTTP/1.1 415
