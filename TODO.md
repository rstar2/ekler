# TODOs

## Firebase

- ~~Create "dbAddEkler_app" Callable Function that will add "ekler(s)" - e.g. update necessary DB collections and also insert a history-record.~~

## Client

- ~~Add real-time update of the DB when~~
    - ~~a different user updates his name/profileURL, e.g for users DB~~
    - ~~new User is added - e.g for users DB~~
    - ~~new Eklers are added - e.g for eklers DB~~
    - ~~new history record is added - e.g. for history DB~~
- Add caching in service-worker
- ~~Add profile page - update password and show/update profile - displayName and photoURL~~
- Add "Push (or just Web) notifications"
- Add "checkout" eklers
- Add "Loading" state where needed on async actions
- Add real CSS theme - active route CSS-class also to be included
- Add history-load pagination and virtual scroll

## CLI

- ~~Add add user - create with user/name and predefined password - must be added into the users DB also~~
- Add delete user - from Authorization and from all DBs
- Add rename of DB collection/document

## CI/CD

- Add GitHub Actions for building and deploying