# TODOs

## Firebase

- ~~Create "dbAddEkler_app" Callable Function that will add "ekler(s)" - e.g. update necessary DB collections and also insert a history-record.~~
- ~~Send email (not only Push messages) when user is "checked-out" or received eklers~~

## Client

- ~~Add real-time update of the DB when~~
    - ~~a different user updates his name/profileURL, e.g for users DB~~
    - ~~new User is added - e.g for users DB~~
    - ~~new Eklers are added - e.g for eklers DB~~
    - ~~new history record is added - e.g. for history DB~~
- ~~Add profile page - update password and show/update profile - displayName and photoURL~~
- ~~Add "Push notifications"~~
- ~~Add caching in service-worker~~
    > Auto "fixed"from using vue-pwa and Workbox
- ~~Add "checkout" eklers~~
- ~~Add "Loading" state where needed on async actions~~
- Add real CSS theme - active route CSS-class also to be included
- Add history-load pagination and virtual scroll (when history becomes too big)
- ~~Add avatars~~
    - ~~Firebase storage~~
    - ~~web-screenshot~~
    - ~~file-select~~

- Allow users to "DISABLE" receiving of such notification emails
- ~~Unlock "check-outed" friend - e.g. owner got his requested eklers from the other user, so "unlock/clear" him~~
- ~~Make the auth-user/locked-users with different colors - e.g. to stand-out from others~~
- ~~Load avatars from the user's avatarURL and not from the FirebaseStorage getDownloadURL()~~

- Add tests (unit and e2e)

## CLI

- ~~Add add user - create with user/name and predefined password - must be added into the users DB also~~
- Add delete user - from Authorization and from all DBs
- Add rename of DB collection/document

## CI/CD

- ~~Add GitHub Actions for building and deploying~~

## Bugs

- GUI - The graph/net is not positioned properly and is not visible all of it,
        later resizing the window also makes things worse
    > Try other graph/network libs like:
       - https://visjs.org/ (https://github.com/visjs/vis-network, example: https://visjs.github.io/vis-network/examples/network/nodeStyles/circularImages.html)

