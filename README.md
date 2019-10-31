# Cipherise TypeScript SDK
## Version 6.3.1

This SDK is for interacting with a Cipherise server; it compiles to ES6-compliant JavaScript, and 
uses ESNext features such as `async` and `await`. This means it can be used in a 
sufficiently-compliant JavaScript environment, such as Node >6.0.0, recent browsers, and more.

## Installation
Use NPM to install:
    `npm i cipherise-sdk`

Otherwise, clone the repository and build:
    `npm run build`

The dist folder will contain the package to import.

Note, your TypeScript project should target 'es6'. Ie the following line should be in your tsconfig.json.
    `"target": "es6",`

## Introduction
The purpose of this SDK is to provide Cipherise Authentication and associated functionality 
to your Service.


---
## Getting Started
Cipherise key concepts can be summarised into the following sections:

### Service Management
The main purpose of Cipherise is to protect a resource. In Cipherise terminology, that resource is
called a Service. The application that is then using the Cipherise SDK is a Service Provider.
Cipherise must know of this Service Provider to be able to offer any capability. 

Service Provider management operations include:

  * [Querying a Cipherise server](#QueryCS)
  * [Creating new services](#NewService)
  * [Revoking services](#RevokeService)

### User Management
In order to interact with Cipherise, a user must been enrolled to a Service Provider. This 
interaction is the key point in which the trust relationship is established. Future authentications
rely on the trust established at enrolment time. For a service that is binding a secure profile to 
their Cipherise enrolment, a secure environment must be considered. For example, adding Cipherise
to an existing profile in a site may require the user to be logged in. If Cipherise is being used
for physical access, it could require being present in the physical environment for enrolment 
binding to be accepted. Alternatively, an SMS could also be sent from a profile to the owner's 
device.

Some services need not require a personalised account, and it may be sufficient to offer the 
instantaneous creation of an anonymous account, simply by scanning of a WaveCode.

  * [Enrolling a user to a service](#EnrolService)
  * [Revoking users from a service](#RevokeUser)
  
### Authentication

Once a user is enrolled to a Service Provider, they can authenticate themselves.
Cipherise Authentication is bi-directional, meaning that the Service Provider will verify the
user's device and the user's device will verify the Service Provider. 
Authentication can be used in a variety of ways. It can be simple access control, physical or 
digital but it can also be part of a workflow. Workflows could include financial 
transaction approval, manager approval or multiple party approval for example.

There are two types of authentication, WaveAuth and PushAuth. A PushAuth is 
targeted to a specific user, where WaveAuth is performed by displaying a WaveCode image that can be 
scanned by a user. Once authenticated, the Service Provider will be informed of the user's 
username.

  * [WaveAuth](#WaveAuth)
  * [PushAuth](#PushAuth)
  * [Non blocking option](#NonBlockAuthentication)
  
### Advanced Features  

Serialization enables sharing of sessions between separate environments; they can be 
serialized and stored by one environment, and then retrieved and deserialized by another 
environment. This is most useful for concurrent/cluster environments in which sessions can be 
shared between cluster nodes using a central store, such as Redis.

  * [Serialization/Deserialization](#Serialization)

Payload is a feature where a Service Provider can encrypt and send data to a user's device
for storage via an authentication or at enrolment, and then retrieved from user device when 
required via an authentication. Each individual payload has a maximum size of 4k bytes.
Ideally, this would be used by a Service, such that any private or sensitive user data that the 
server requires could be held at rest on the user's own device rather than held collectively at
the service's storage where the consequences of a hack are far further reaching.
Examples of where payload could be used include credit card payment details for a regularly used
service, address details or other personally identifying details.

  * [Payload](#Payload)
 

---
## Cipherise Functionality

  * [Querying a Cipherise server](#QueryCS)
  * [Creating new services](#NewService)
  * [Revoking services](#RevokeService)
  * [Enrolling a user to a service](#EnrolService)
  * [Revoking users from a service](#RevokeUser)
  * [WaveAuth](#WaveAuth)
  * [PushAuth](#PushAuth)
  * [Non blocking option](#NonBlockAuthentication)
  * [Serialization/Deserialization](#Serialization)
  * [Payload](#Payload)

### <a name="QueryCS"></a>Querying a Cipherise server
A Cipherise server can be queried for information about itself and what it supports using 
`Client.serverInformation`. See [here](https://developer.cipherise.com/resources/docs/typescript/classes/client.html#serverinformation).

This is demonstrated below:
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  // Retrieve information from the server and print it out.
  const info = await client.serverInformation();
  console.log("Server version: ", info.serverVersion);
  console.log("Build version: ", info.buildVersion)
  console.log("Minimum app version: ", info.appMinVersion);
  console.log("Maximum supported payload size: ", info.maxPayloadSize);
}

example();

```
### <a name="NewService"></a>Creating new services
The first step to integrating your Service Provider with Cipherise is to create a Cipherise
[service](https://developer.cipherise.com/resources/docs/typescript/classes/service.html). This 
[service](https://developer.cipherise.com/resources/docs/typescript/classes/service.html) is the Cipherise 
representation of your service, and is used by your Service Provider to communicate with the
Cipherise system and issue requests.

To achieve this, first create a [Client](https://developer.cipherise.com/resources/docs/typescript/classes/client.html) to connect to a Cipherise server. 
A Cipherise server can be created at [developer.cipherise.com](https://developer.cipherise.com).

```typescript
const client = new cipherise.Client("https://your.cipherise.server.here");
```

Next, use the [Client](https://developer.cipherise.com/resources/docs/typescript/classes/client.html) to create a new 
[service](https://developer.cipherise.com/resources/docs/typescript/classes/service.html). A 
[service](https://developer.cipherise.com/resources/docs/typescript/classes/service.html) is not stored anywhere by default; in order to retrieve the same 
[service](https://developer.cipherise.com/resources/docs/typescript/classes/service.html) again, use 
[Service.serialize](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#serialize) 
to store somewhere and 
[Client.deserializeServiceAsync](https://developer.cipherise.com/resources/docs/typescript/classes/client.html#deserializeserviceasync) to restore from 
storage.

```typescript
const service = await client.createService("Your Service Here");
```
or
```typescript
const serializedService = /* load from database or filesystem */;
const service = await client.deserializeServiceAsync(serializedService);
```

A complete example using the filesystem follows.
```typescript
import * as cipherise from "cipherise-sdk";
import * as fs from 'fs';

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const filename = serviceName + ".service";

async function example() {
  const client = new cipherise.Client(cipheriseServer);

  let service;
  if (fs.existsSync(filename)) {
    // If the service has been saved to disk, load it.
    const serializedService = fs.readFileSync(filename);
    service = await client.deserializeServiceAsync(serializedService);
  } else {
    // Otherwise, create the service and store it.
    service = await client.createService(serviceName);
    fs.writeFileSync(filename, service.serialize());
  }
}

example();

```
### <a name="RevokeService"></a>Revoking services
A service can revoke itself using [Service.revoke](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#revoke). This may be done 
when, for example, a Cipherise integration is uninstalled. Revoking a service will disable it and
remove it from the list of services on users' devices. It cannot be undone.

A complete example of service revocation follows:
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);
  await service.revoke();
  // The service can no longer be used.
}

example();

```
### <a name="EnrolService"></a>Enrolling a user to a service
The enrolment process enrols a user to a Cipherise service so that they can use Cipherise to 
interact with the service. The enrolment process is multi-step:

1) An enrolment WaveCode is presented to the user 
([Service.enrolUser](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#enroluser), 
[Enrolment.WaveCodeUrl](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#WaveCodeurl)).

2) The user scans the WaveCode, and the service retrieves the result by long-polling on 
validation [Enrolment.validate](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#validate). The result is the URL from which
to identicon can be displayed.

3) The service presents the identicon returned from the validation step. 

4) The user confirms that it matches the identicon presented on their device. The service presents
buttons that can be used to accept or deny the enrolment. See 
[Enrolment.confirm](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#confirm).

Additionally, the SDK supports a short-polling workflow: 
[Enrolment.getState](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#getstate) can be short-polled before 
[Enrolment.validate](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#validate) is called. The values it can return are:

* [EnrolmentState.Initialised](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#initialised): The enrolment has been 
started.
* [EnrolmentState.Scanned](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#scanned): The enrolment WaveCode has been 
scanned.
* [EnrolmentState.Validated](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#validated): The service provider has 
received information about the device.
* [EnrolmentState.Confirmed](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#confirmed): The service provider has 
confirmed whether or not the enrolment has succeeded.
* [EnrolmentState.Failed](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#failed): The enrolment has failed.
* [EnrolmentState.Unknown](https://developer.cipherise.com/resources/docs/typescript/enums/enrolmentstate.html#unknown): Unknown state. Should never occur.

For example, short-polling code may check for `EnrolmentState.Scanned`, and then call 
`enrolment.validate`. This will immediately return (as the result is available), and then 
the user can accept or deny the enrolment as required.

A complete example of the long-polling workflow follows:
```typescript
import * as cipherise from "cipherise-sdk";
import * as readline from "readline";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const userName = "Test User";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);

  // (1) Start an enrolment and present the WaveCode to the user.
  const enrolment = await service.enrolUser(userName);
  console.log("WaveCode URL:", enrolment.WaveCodeUrl);
  // (2) Wait for the user to scan and retrieve the identicon.
  const identiconUrl = await enrolment.validate();
  // (3) Display the identicon.
  console.log("Identicon URL:", identiconUrl); // (3)

  // Ask the user whether they want to confirm the enrolment or not.
  rl.question("Accept? (y/n): ", async (answer) => {
    const confirm = answer.toLowerCase().startsWith("y");
    // (4) Confirm the enrolment as appropriate.
    await enrolment.confirm(confirm);
    rl.close();
  });
}

example();

```
### <a name="RevokeUser"></a>Revoking users from a service
A service can revoke enrolled users using [Service.revokeUser](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#revokeuser). 
This could be called for a number of reasons. For example, a user leaves an organisation and is no 
longer authorised for access. To regain access, the user must re-enrol.

Additionally, the optional `devices` parameter to `revokeUser` can be used to revoke a subset of
the user's devices. A potential use for this parameter is to revoke a device that a user has lost.

A complete example of user revocation follows:
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const userName = "Test User";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);

  // Automatically enrol the user.
  const enrolment = await service.enrolUser(userName);
  console.log("Enrolment WaveCode URL:", enrolment.WaveCodeUrl);
  await enrolment.validate();
  await enrolment.confirm(true);

  // Revoke the user.
  await service.revokeUser(userName);

  // Confirm that they are no longer enrolled.
  console.log("Enrolled?", await service.userEnrolled(userName));
}

example();

```
### <a name="WaveAuth"></a>Wave authentication
WaveAuth is where the user 'waves' their device over the presented coded image. It is
ideal to log in with and upon successful authentication, will provide the Service Provider with 
the name of the enrolled application user.

The general flow consists of the following steps:

1) An authentication WaveCode is presented to the user. The WaveCode is an image, and its URL is
obtained by initialising the authentication process. Call 
[Service.WaveAuth](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#WaveAuth) and display the image from the 
returned data, located at 
[WaveAuth.WaveCodeUrl](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#wavecodeurl).

2) The service retrieves the authentication result by calling 
[WaveAuth.authenticate](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#authenticate). Note that this 
is a blocking call and will not return until a user has scanned the returned image and completed
the authentication challenge, OR until the authentication times out.

3) The user scans the QR code and completes the authentication challenge.

4) The service receives the [authentication result](https://developer.cipherise.com/resources/docs/typescript/classes/authenticationresult.html). It 
contains the actual [result of the authentication](https://developer.cipherise.com/resources/docs/typescript/classes/authentication.html), the username and
an optional payload response (more in the Payload section).

A complete example of the WaveAuth flow is shown (with a preliminary enrolment):
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const userName = "Test User";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);

  // Automatically enrol the user.
  const enrolment = await service.enrolUser(userName);
  console.log("Enrolment WaveCode URL:", enrolment.WaveCodeUrl);
  await enrolment.validate();
  await enrolment.confirm(true);

  // (1) Start and present WaveAuth.
  const auth = await service.WaveAuth(
    "Description of the authentication, appears in the app",
    "Secondary information, appears in the app",
    cipherise.AuthenticationLevel.OneTiCK
  );
  console.log("Authentication WaveCode URL:", auth.WaveCodeUrl);

  // (2) Retrieve authentication result.
  const result = await auth.authenticate();
  console.log("Authenticating username:", result.username);
  console.log(
    "Did the authentication succeed?",
    result.authenticated === cipherise.Authenticated.Success
  );
}

example();

```
### <a name="PushAuth"></a>PushAuth
PushAuth is a Cipherise authentication that is sent to a particular user's device. This 
can only be used when the Service wants to target a specific user and the username and device id 
are known for that user. Ideally, this is suited for workflow related cases, such as authorising a 
banking transaction (targeted user is the owner of the transferring account), or seeking permission
for a privileged activity (targeted user is the supervisor of the user seeking permission).

The general flow consists of the following steps:

1) Look up the username (the name the user was enrolled to Cipherise as) of the authenticating 
user.

2) Get the device id for the user. This can be determined by calling 
[Service.getUserDevices](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#getuserdevices). Note that there can be more than one
device registered to a user. In this situation, the Service will need to determine which one(s) to 
send the authentication to.

3) Send an authentication to the user's device, by calling 
[Service.PushAuth](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#pushauth). This will return a 
[PushAuth](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html)

4) The service retrieves the authentication result by calling 
[PushAuth.authenticate](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html#authenticate). Note that this call is 
blocking, awaiting timeouts or the User to complete the authentication on their device.

5) The user responds to the authentication notification on their device and solves the 
authentication challenge on their phone.

6) The [result of the authentication](https://developer.cipherise.com/resources/docs/typescript/classes/authentication.html) contains the username, what the
user responded with, and an optional payload response (See more in the [Payload](#Payload) 
section).

A complete example of the long-polling PushAuth flow is shown (with a preliminary 
enrolment):
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const userName = "Test User";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);

  // Automatically enrol the user.
  const enrolment = await service.enrolUser(userName);
  console.log("Enrolment WaveCode URL:", enrolment.WaveCodeUrl);
  await enrolment.validate();
  await enrolment.confirm(true);

  // (1) Retrieve a device.
  const devices = await service.getUserDevices(userName);
  // Take the last device returned (the most recent device).
  const device = devices[devices.length - 1];

  // (2) Send a PushAuth to the device.
  const auth = await service.PushAuth(
    userName,
    device,
    "Description of the authentication, appears in the app",
    "Secondary information, appears in the app",
    "Notification message, appears in the push notification",
    cipherise.AuthenticationLevel.OneTiCK
  );

  // (3) Retrieve the result of the authentication.
  const result = await auth.authenticate();
  console.log("Authenticating username:", result.username);
  console.log(
    "Did the authentication succeed?",
    result.authenticated === cipherise.Authenticated.Success
  );
}

example();

```
### <a name="NonBlockAuthentication"></a> Short-polling
There is a non-blocking alternative workflow for [WaveAuth](#WaveAuth) and 
[PushAuth](#PushAuth). Prior to calling 
[WaveAuth.authenticate](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#authenticate) or 
[PushAuth.authenticate](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html#authenticate) which both block 
awaiting the user, [WaveAuth.getState](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#getstate) or 
[PushAuth.getState](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html#getstate)
can be called to immediately return the current state of the
authentication. The values it can return are:

* [AuthenticationState.Initialised](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#initialised): The authentication
has been started, but no user action has occurred. The authentication result should not yet be 
requested.
* [AuthenticationState.Scanned](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#scanned): This state is only 
applicable in WaveAuth. It is returned when a Cipherise application user has scanned the
displayed WaveCode. The authentication has not yet been completed, so the result should not
yet be requested.
* [AuthenticationState.PendingAppSolution](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#pendingappsolution): The 
user still needs to solve the challenge issued by the Service Provider in the Cipherise 
application. The authentication result should not yet be requested.
* [AuthenticationState.Done](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#done): The authentication has been 
completed and the result is available. The authentication result should now be requested.
* [AuthenticationState.NotFound](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#notfound): The Cipherise Server 
does not know about this authentication. This typically occurs because the authentication has 
already been completed or the authentication has expired. There is no need to follow this up with
the call to the authentication result.

As a workflow example, short-polling code for a WaveAuth may check for 
[AuthenticationState.Done](https://developer.cipherise.com/resources/docs/typescript/enums/authenticationstate.html#done), 
and then call [WaveAuth.authenticate](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#authenticate). This
will immediately return (as the result is available), and the service can then accept the results 
of the authentication.


### <a name="Serialization"></a>Serialization/deserialization
All classes with an extended lifetime (sessions, etc) support serialization and deserialization. 
Serialization packs the state of the session into a byte buffer, which can then be stored and 
transferred as appropriate. As this buffer consists of raw bytes, care must be taken in transport; 
consider encoding as Base64 or hex as required.

These classes feature a `serialize` method, while the "parent" class (e.g. the parent for 
`WaveAuth` is `Service`) features the counterpart deserialization method. A full list is
supplied below:

* [Service.serialize](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#serialize) / 
[Client.deserializeServiceAsync](https://developer.cipherise.com/resources/docs/typescript/classes/client.html#deserializeserviceasync)
* [Enrolment.serialize](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#serialize) / 
[Service.deserializeEnrolment](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#deserializeenrolment)
* [PushAuth.serialize](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html#serialize) / 
[Service.deserializePushAuth](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#deserializepushauth)
* [WaveAuth.serialize](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#serialize) / 
[Service.deserializeWaveAuth](https://developer.cipherise.com/resources/docs/typescript/classes/service.html#deserializewaveauth)

For an example of how these methods may be used, please look at the example for 
[Creating new services](#creating-new-services).


### <a name="Payload"></a>Payload

Payload data can be supplied to the user's device during 
[enrolment](https://developer.cipherise.com/resources/docs/typescript/classes/enrolment.html#confirm) and supplied and fetched during authentication, both
[PushAuth](https://developer.cipherise.com/resources/docs/typescript/classes/pushauth.html#authenticate) and 
[WaveAuth](https://developer.cipherise.com/resources/docs/typescript/classes/waveauth.html#authenticate). Payload data is arbitrary and is 
controlled by the Service Provider.

A complete example for enrolment follows:
```typescript
import * as cipherise from "cipherise-sdk";

const cipheriseServer = "https://your.cipherise.server.here";
const serviceName = "Example Service";
const userName = "Test User";

async function example() {
  const client = new cipherise.Client(cipheriseServer);
  const service = await client.createService(serviceName);

  // Automatically enrol the user.
  const enrolment = await service.enrolUser(userName);
  console.log("Enrolment QR code URL:", enrolment.WaveCodeUrl);
  await enrolment.validate();
  await enrolment.confirm(true,
    cipherise.PayloadRequestBuilder.build(p => p.withSet({
      hello: "world",
    }))
  );
}

example();

```
