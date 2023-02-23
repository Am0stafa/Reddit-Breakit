- onclick on post bar in home popup to choose a community
- make the submit page protected
- add in the documentation the firebase setting
- make the private communities private and send request to the admin
- algolia to search for the post communities and people
- add the link functionality with the scraper function
<br>
### vulnerabilities
- reflected xss in search
- stored xss in message by sending a broken image with a script
- SSRF in the scraper leading to a DOS
- os command injection in the image name
- sql injection to get users information, post, email (sensitive data disclosure)
- break the encryption by tracing the key from the console.log
- make a post by another user
- make a post in a community you are not in
- sign users out
- join a private community without being invited
- file upload: large file denial of service, bypass the limit
- TRY: csrf to make a user delete his account
