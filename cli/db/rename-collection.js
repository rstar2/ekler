#!/usr/bin/env node

// TODO: not ready yet

const admin = require('./node_modules/firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

  databaseURL: '<Replace with your URL>'
});

const collectionNamePull = 'testOld';

const collectionNamePush = 'testNew';

const file = './firestore-export.json';

firestore
  .collection(collectionNamePull)

  .get()

  .then(snapshot => {
    const data = {};

    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });

    return data;
  })

  .then(data => {
    // Write collection to JSON file

    fs.writeFile(file, JSON.stringify(data), function(err) {
      if (err) {
        return console.log(err);
      }
      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          return console.log(err);
        }

        return JSON.parse(data);
      });
    });
  })

  .then(async dataArray => {
    for (const doc in dataArray) {
      if (dataArray.hasOwnProperty(doc)) {
        await startUpdating(collectionNamePush, doc, dataArray[doc]);
      }
    }
  })

  .catch(error => {
    console.log(error);
  });

function startUpdating(collectionNamePush, doc, data) {
  let parameterValid = true;

  // Please note you need to do extra modification for Date and GeoTag locations.
  // For date you need to use new admin.firestore.Timestamp(data[<Field name that holds Date>]["_seconds"],data[<Field name that holds date>]["_nanoseconds"]);

  if (parameterValid) {
    return new Promise(resolve => {
      firestore
        .collection(collectionNamePush)
        .doc(doc)

        .set(data)

        .then(() => {
          console.log(`${doc} is imported successfully to firestore!`);

          resolve('Data wrote!');
        })

        .catch(error => {
          console.log(error);
        });
    });
  } else {
    console.log(`${doc} is not imported to firestore. Please check your parameters!`);
  }
}
