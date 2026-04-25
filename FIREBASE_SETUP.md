# Firebase Setup Guide for SchoolBridge

To ensure the application works correctly, please follow these steps in the Firebase Console:

## 1. Enable Google Sign-In
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left sidebar, click **Build** > **Authentication**.
4. Click the **Sign-in method** tab.
5. Click **Add new provider** and select **Google**.
6. Switch the status to **Enabled**.
7. Set the **Project support email**.
8. Click **Save**.
9. (Optional) Disable **Email/Password** provider if it was previously enabled.

## 2. Authorize Domains
1. Go to **Authentication** > **Settings**.
2. Click on the **Authorized domains** tab.
3. Ensure your production URL and `localhost` (if testing locally) are listed.
4. If missing, click **Add domain** and enter the domain.

## 3. Verify Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Ensure you have a database created in the region specified during setup (e.g., `europe-west2`).
3. Verify that the rules match the content of `firestore.rules` in your project.
