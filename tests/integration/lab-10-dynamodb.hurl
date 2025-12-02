# tests/integration/lab-10-dynamodb.hurl
# Lab 10 – DynamoDB integration test

# ----------------------------------------------------------
# 1) POST a JSON fragment
# ----------------------------------------------------------

POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

{
  "service": "DynamoDB"
}

HTTP/1.1 201
[Asserts]
header "Location" exists

[Captures]
fragment1_url: header "Location"
fragment1_id: header "Location" regex "/v1/fragments/(.*)$"


# ----------------------------------------------------------
# 2) GET the metadata for the first fragment
# ----------------------------------------------------------

GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" exists
jsonpath "$.fragment.created" exists
jsonpath "$.fragment.updated" exists
jsonpath "$.fragment.ownerId" exists


# ----------------------------------------------------------
# 3) POST second Markdown fragment
# ----------------------------------------------------------

POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

`DynamoDB is **great**.`

HTTP/1.1 201
[Asserts]
header "Location" exists

[Captures]
fragment2_url: header "Location"
fragment2_id: header "Location" regex "/v1/fragments/(.*)$"


# ----------------------------------------------------------
# 4) GET metadata for second fragment
# ----------------------------------------------------------

GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" exists


# ----------------------------------------------------------
# 5) GET list of fragments (IDs only)
# ----------------------------------------------------------

GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments[*]" contains "{{fragment1_id}}"
jsonpath "$.fragments[*]" contains "{{fragment2_id}}"


# ----------------------------------------------------------
# 6) DELETE first fragment
# ----------------------------------------------------------

DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200


# ----------------------------------------------------------
# 7) First fragment should now be 404
# ----------------------------------------------------------

GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404


# ----------------------------------------------------------
# 8) List again – second should remain, first is gone
# ----------------------------------------------------------

GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments[*]" not contains "{{fragment1_id}}"
jsonpath "$.fragments[*]" contains "{{fragment2_id}}"