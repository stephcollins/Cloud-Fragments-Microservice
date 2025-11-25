# tests/integration/lab-9-s3.hurl
# Lab 9 – S3 integration test

# 1) POST a new text fragment as an authorized user

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
header "Location" exists

[Captures]
url: header "Location"


# 2) GET the fragment using the captured URL

GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello S3!"


# 3) DELETE the fragment

DELETE {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200


# 4) Try to GET again – should now be 404

GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404