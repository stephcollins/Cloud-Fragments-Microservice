# Lab 10: JSON fragments supported

POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{"message":"hello world"}

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
header "Location" exists

# Save the Location header into a variable called "loc"
[Captures]
loc: header "Location"

# Use the captured variable
GET {{loc}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json"