# Send SMS Directly from the Browser (No Backend Code Needed)
## Do More With Frontend
Frontend developers these days have a lot more power with just frontend code.
It's not just about new browser APIs, but also about backendless tools that let you build a complete application without any backend code.
However, there's still one area where backend code is required: backend-ish APIs that need access control enforcement.
The reason for that, is that those APIs need to be authenticated with a secret key that cannot be exposed in the frontend.
But guess what? That changes now!

In this article, we'll explore an awesome new way to use backend APIs that are often needed as a feature in frontend applications.
We'll learn how to send SMS (or messages on WhatsApp, Viber, and Facebook Messenger) directly from the browser.
To authenticate our users in the browser, we'll use Clerk.dev, and for managing their permissions to send messages using Vonage APIs, we'll rely on Permit.io.
So let's dive in and see how it's done!

## Frontend Only Authorization
The approach we will take in this article to authorize our users to send messages is called Frontend Only Authorization (FoAz), an open standard created by Permit.io.
FoAz is based on a proxy service that verifies the user's frontend JWT token, check if they have proper permissions to perform the API call, and then forward the call to the backend API.
By using FoAz, we can authenticate our users in the frontend, and then use the same JWT token to authorize them to perform API calls.
Let's start the tutorial by setting up our application.

## Setup the Application
For building our application, we will use react framework.
You don't need any prior knowledge of react to follow along, as the code is short and we will explain it as we go.
You'll need a local installation of node.js and npm to continue with the tutorial.

First, let's create a new react app by using vite, a fast build tool for modern web apps.
Open your terminal and run the following command in your desired projects directory:

```bash
npm create vite@latest frontend-messages-demo --template react \
    && cd frontend-messages-demo \
    && npm install
```

This will create a new react app in the `frontend-messages-demo` directory.

We can see our app by running the following command:

```bash
npm run dev
```

This will start a local development server and open a browser window with our app.

## Setup Authentication in the App
As a first step to access control, we will need a way to authenticate our application users, so we can verify their identity.
For this, we will use Clerk.dev, a frontend-first authentication platform that lets you add authentication to your application in minutes.
Clerk offers a free tier that is more than enough for our needs, let's go to https://dashboard.clerk.com/sign-up and create an account there.
Let's setup our newly created vite app to use Clerk.dev for authentication.

1. Go to Clerk.com and create a free account
2. In the Clerk dashboard, click on `Add Application`
3. Give your application a name, and click `Create Application` (I named mine `Frontend Messages Demo`)
4. In the next screen, choose the `React` option, and copy the key that shows up
5. In our React app, create a new file in the root folder called `.env` and add the following line to it (It is important to add the `VITE_` prefix to the variable name, as vite will use it to inject the variable into our app):
```bash
VITE_CLERK_FRONTEND_API_KEY=<YOUR_API_KEY_HERE>
```
5. In the same folder, run the following command on your terminal to install the Clerk SDK:
```bash
npm install @clerk/clerk-react
```

As we setup the Clerk account in our application, it is time to test the user authentication.

1. In the `App.tsx` file, remove the whole content of the `return` section of the `App` function and replace it with the following code:
```tsx
function App() {
  return (
    <>
      <ClerkProvider publishableKey={clerkPubKey}>
        <SignedIn>
          <SendMessage />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkProvider>
    </>
  )
}
```
2. You can also remove now all the redudnant imports from the top of the file, and replace them with the following imports for the components we use:
```tsx
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
```
4. In the top of the file, before the `App` funcition, let's create an empty component to verify our users' login status:
```tsx
function SendMessage() {
  const { isSignedIn, getToken, firstName } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return null;
  }

  return (
    <div>
      <h1>Hello {firstName}</h1>
    </div>
  )
}
```
3. Going now back to the browser, we can see that the app is now showing a login screen.
4. Let's go back to Clerk dashboard and create two users to mock our permission model with two users. For the example, let's used the following emails: `admin@messaging-foaz.app` and `user@messaging-foaz.app` (choose any password you want).
TBD picture
5. As we create the users, let's go back to our newly created app and login with one of the users, check that we see the correct name in the app.
TBD picture

At this point, we have our users authenticated, and we can start working on the permissions model.

## Setting Up Permissions for Sending SMS
Now that we have our users authenticated, we need to setup the permissions for sending messages.
Let's say that our application has two kinds of users: admins and regular users.
We want to allow admins to send messages and deny regular users from sending messages.

Let's configure the API call to Vonage in Permit.io to allow admins to send messages.

### Get API Secret from Vonage
Sending an SMS is something that requires service provider, and in this tutorial we will use Vonage.
Vonage is a cloud communications platform that offers APIs for SMS, voice, and video.
By using the following signup link, you can get TBD credit to use Vonage APIs: https://dashboard.nexmo.com/sign-up?utm_source=DEV_REL&utm_medium=referral&utm_campaign=frontend-messages-demo

After sign up, you will need to create a new API key and secret.
You can find your Vonage API key and secret in the ![https://dashboard.nexmo.com/](Vonage dashboard).
!TBD picture

### Configure the API Call Permissions in Permit.io
To use FoAz, we will need to setup the particular SMS sending API call to Vonage in Permit.io, and let user perform that call only if they have the right permissions.
If you are not a Permit.io user yet, go now to ![https://app.permit.io](Permit.io) and create a free account.

After sign in, you'll have to go to `FoAz Proxy` page, and click `Add Configuration`.

This is how the configuration page should look like:
!TBD picture
Let's go over the fields to make sure we understand what we are doing here:
1. In the URL field, enter `api.nexmo.com/v1/messages`. This is the API endpoint we will use to send messages.
2. In the `http Method` field, select `POST`. This is the HTTP method we will use to send messages.
3. In the `Select Resource` field, choose create a new resource and call it `Message`. This is the name of the resource we will use to give permissions.
4. When you create the resource, also assign one action to it. Let call it `Send`.
5. After creating the resource, Choose the `Send` action in the `Select Action` field.
6. In the `Secret Configuration` field, choose `Basic` and insert the API key and secret you got from Vonage in the relevant fields.

At this point, we configure the FoAz proxy to support our call to Vonage, we now can configure the permissions for our users.

### Assigning Permissions to Users
One of the easiest methods to check if user has permissions to perform an action is to use the Role-Based Access Control (RBAC) model.
In RBAC, we assign role(s) to users, and then we can define which roles can perform which actions on which resources.

1. In Permit.io `Policy` page, go to the `Roles` tab and create two roles: `Admin` and `User`.
2. Let's go to Clerk dashboard, and find the `User ID` of the admin user we created earlier. You can find the `User ID` in the `User Profile` page.
3. In Permit.io, go to the `Users` tab and create a new user with the `User ID` of the admin user we found in the previous step, assign the `Admin` role to the user.
4. Repeat the previous two steps for the regular user we created earlier, but assign the `User` role to the user.
At the end, we should have the following users and roles in Permit.io:
!TBD picture

Now that we have our users and roles, we can assign permissions to them.
In Permit.io, go to Policy editor. In the `Admin` check the box next to the `Send` action we created earlier for the `Message` resource.

### Configure Clerk JWKs in Permit.io
Now, that we have all our permissions configured, we need to configure the way that Permit.io will verify the JWT token that Clerk generates for our users.
As our users authenitcated to our app, Clerk generates a JWT token for them.
Permit.io is using Clerk JWKs to verify the JWT token, so we need to configure the JWKs in Permit.io.

1. In Clerk dashboard, go to `JWT Template` page and click `New Template`. This template will use to configure JWTs that are generated for FoAz.
TBD picture
2. In the popup opened, click `Blank`
TBD picture
3. Give our token a `name` and leave all the other fields with their default values.
TBD picture
4. Copy the `JWKS Endpoint` URL and open it in a new tab.
TBD picture
5. In Permit.io, Go to `Settings` screen, and then in the `JWKs Config` tab, click `Configure` on the Environment you use (you can see the active environment in the left sidebar)
TBD picture
6. In the popup, paste the content from the `JWKS Endpoint` page we opened in the previous step, and click `Save`.

As we done will al the configuration, let's go back to our application code and send our first message!

## Sending Messages from the Browser
First, to send a message, let's create the UI components that will use as a form for sending messages.
To make our UI look nicer, we will install Material UI, a popular React UI framework for fancy UI components.

In the terminal, run the following command to install Material UI:
```bash
npm install @material-ui/core
```

Now, let's create the UI components for sending messages.
In the `SendMessage` function in `App.tsx` file, replace the return statement of the function with the following code:
```tsx
<>
      {error && <Alert severity='error'>{error}</Alert>}
      <Container maxWidth="sm">
        <Paper component={'form'} sx={{ p: 1 }} onSubmit={send}>
          <Box sx={{ display: 'flex' }}>
            <FormControl sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel id="via-select-label">Send Via</InputLabel>
              <Select id="via-select" labelId='via-select-label'>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ mb: 1,flex: 1 }}>
              <InputLabel id="to-select-label">To</InputLabel>
              <TextField id="to" />
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <FormControl sx={{ m: 0, minWidth: 200, flex: 1 }}>
              <InputLabel id="message-label">Message</InputLabel>
              <TextField id="message" />
            </FormControl>
          </Box>
          <Button variant="contained" type="submit" fullWidth sx={{ mt: 1 }}>Send</Button>
        </Paper>
      </Container>
    </>
```

Going back to the browser, you should see a message sending form like this:
TBD picture

Now, let's add the code that will send the message.
In the `App.tsx` file, add the following code to the `SendMessage` function:
```tsx
TBD code
```

Going back to the browser, let's now try to send a message.
TBD picture
And, it works!
TBD picture

Congratulations! You just sent your first message from the browser without any backend code!

## What Next?
In this article, we touched the tip of the iceberg of what you can do with FoAz.
Even if we continue with the SMS sending example, there are many things we can do to improve our application.
Sending messages in different channels and limit the send only for particular users, limit roles to send only to particular countries, and more.

But, FoAz is not limited to SMS sending.
You can use FoAz to access any API that requires authentication, and you can use it to build a complete application without any backend code.
And, you can use it with any frontend framework, not just React.

We hope your enjoyed this article, and already thinking about how you can use FoAz in your next project.
To stay in touch and contribute the revolution of frontend development, join our community at TBD link.
```
