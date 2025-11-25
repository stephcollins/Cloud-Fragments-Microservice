# tests/integration/post-fragments-charset.hurl
# Confirm that Content-Type with charset is accepted,
# but API strips out charset and returns text/plain

POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`Hello charset test`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
# API only returns text/plain (charset removed)
jsonpath "$.fragment.type" == "text/plain"

[Captures]
url: header "Location"

GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello charset test"
