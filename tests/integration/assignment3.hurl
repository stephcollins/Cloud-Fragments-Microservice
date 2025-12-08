# tests/integration/a3-complete.hurl
# Assignment 3 – Full API Spec Test Coverage

# -------------------------------------------
# 0) VARIABLES
# -------------------------------------------
# user1 is valid authenticated user

# -------------------------------------------
# 1) UNAUTHENTICATED REQUESTS → 401
# -------------------------------------------
GET http://localhost:8080/v1/fragments

HTTP/1.1 401


# -------------------------------------------
# 2) POST — Create a Plain Text Fragment
# -------------------------------------------

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello World A3 Test`

HTTP/1.1 201
[Asserts]
header "Location" exists

[Captures]
frag_txt_url: header "Location"
frag_txt_id: header "Location" regex "/v1/fragments/(.*)$"


# -------------------------------------------
# 3) POST — Unsupported Type → 415
# -------------------------------------------

POST http://localhost:8080/v1/fragments
Content-Type: application/pdf
[BasicAuth]
user1@email.com:password1
`This is not actually a PDF.`

HTTP/1.1 415

# -------------------------------------------
# 4) GET — List fragments (IDs only)
# -------------------------------------------

GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments[*]" contains "{{frag_txt_id}}"


# -------------------------------------------
# 5) GET — List fragments expanded
# -------------------------------------------

GET http://localhost:8080/v1/fragments?expand=1
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments[*].id" contains "{{frag_txt_id}}"
jsonpath "$.fragments[*].type" contains "text/plain"


# -------------------------------------------
# 6) GET /:id/info — Metadata only
# -------------------------------------------

GET {{frag_txt_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.id" == "{{frag_txt_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" exists


# -------------------------------------------
# 7) GET /:id — Raw Data
# -------------------------------------------

GET {{frag_txt_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain"


# -------------------------------------------
# 8) Create Markdown fragment for conversion tests
# -------------------------------------------

POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

`Hello A3`

HTTP/1.1 201
[Asserts]
header "Location" exists

[Captures]
frag_md_url: header "Location"
frag_md_id: header "Location" regex "/v1/fragments/(.*)$"


# -------------------------------------------
# 9) GET — Convert Markdown to HTML
# -------------------------------------------

GET {{frag_md_url}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/html"


# -------------------------------------------
# 10) GET — Invalid Conversion → 415
# Trying to convert text/plain → PNG (invalid)
# -------------------------------------------

GET {{frag_txt_url}}.png
[BasicAuth]
user1@email.com:password1

HTTP/1.1 415


# -------------------------------------------
# 11) PUT — Update existing fragment (same type)
# -------------------------------------------

PUT {{frag_txt_url}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Updated Text Fragment Data – A3`

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.type" == "text/plain"


# -------------------------------------------
# 12) PUT — Wrong type → 400
# -------------------------------------------

PUT {{frag_txt_url}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

{ "wrong": true }

HTTP/1.1 400


# -------------------------------------------
# 13) DELETE — Remove Markdown fragment
# -------------------------------------------

DELETE {{frag_md_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200


# -------------------------------------------
# 14) GET deleted fragment → 404
# -------------------------------------------

GET {{frag_md_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404


# -------------------------------------------
# 15) Final list should NOT contain deleted fragment
# -------------------------------------------

GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments[*]" not contains "{{frag_md_id}}"
jsonpath "$.fragments[*]" contains "{{frag_txt_id}}"