# ekler

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Run your end-to-end tests
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

-----------------------------------------------------

### Pre

Install Vuetify
```
vue add vuetify
```

### Deploy to Firebase

```bash
npm run deploy
```

## Usage 

### Create new user

```bash
node cli/index.js db-add-user --email rumenn@qnext.com --password pass123 --name "Rumen Neshev" --title dev

```

### Firebase

1. Sometimes the auth token of the Firebase CLI is expired but it still reports a user is admin
so do:

```bash
firebase logout
firebase login
```

in order ot recreate the auth token for the GitHub Actions CI use:

```bash
firebase login:ci
```

and copy the created GitHub Secrets (it's with FIREBASE_TOKEN key)