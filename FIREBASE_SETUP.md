# Firebase Database Configuration & Setup

To enable secure data storage and sharing features, you need to configure your Firebase project with the following settings.

## 1. Firestore Data Structure

The application uses two main collections:

### `records` Collection
Stores all financial records (Assets, Debts, Insurance).
- **Document ID**: Auto-generated UUID
- **Fields**:
  - `userId` (string): UID of the record owner
  - `type` (string): 'asset', 'debt', 'insurance'
  - `name` (string): Name of the record
  - ... (other data fields)

### `shared_access` Collection
Stores permissions for sharing data between users.
- **Document ID**: Composite key: `{ownerId}_{sharedWithEmail}` (e.g., `user123_spouse@example.com`)
- **Fields**:
  - `ownerId` (string): UID of the user sharing the data
  - `sharedWithEmail` (string): Email of the user receiving access
  - `permission` (string): 'read' or 'edit'
  - `status` (string): 'accepted' (default for now)
  - `createdAt` (timestamp)

## 2. Security Rules

Copy the contents of `firestore.rules` (located in the root of this project) into your Firebase Console:

1. Go to **Firebase Console** > **Firestore Database** > **Rules**.
2. Paste the content of `firestore.rules`.
3. Click **Publish**.

These rules ensure:
- Users can only read/write their own records.
- Users can read records shared with them.
- Users can edit records shared with them ONLY if granted 'edit' permission.
- Users can only manage sharing settings for their own data.

## 3. Indexes (Optional but Recommended)

If you encounter performance issues with sharing queries, you may need to create composite indexes in Firestore.

- Collection: `shared_access`
  - Fields: `sharedWithEmail` (Ascending), `ownerId` (Ascending)

## 4. Authentication

Ensure **Email/Password** or **Google** authentication is enabled in Firebase Console > **Authentication** > **Sign-in method**. The app currently uses Google Sign-In.
