# Security Specification: O'CHAP ERP Fortress

## 1. Data Invariants
- **Identity Consistency**: A user cannot update their own `role` field.
- **Relational Integrity**: An `Order` must link to a valid `customerUid` that matches the creator's UID.
- **Supplier Monopoly**: A product can only be created or modified by the owner of the `supplierId`.
- **Order Immutability**: Once an order is marked `delivered` or `cancelled`, its `totalAmount` and `items` cannot be modified.
- **Timestamp Integrity**: All `createdAt` and `updatedAt` fields must match `request.time`.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing (User)**: Create a user profile with `role: 'admin'` as a non-privileged user.
   - *Target*: `/users/{uid}` (create)
2. **Role Escalation**: Update existing user profile to change `role` from `'client'` to `'admin'`.
   - *Target*: `/users/{uid}` (update)
3. **Ghost Supplier**: Create a `Supplier` entry where `ownerUid` does not match `request.auth.uid`.
   - *Target*: `/suppliers/{sid}` (create)
4. **Unauthorized Product Drop**: Create a `Product` for a `supplierId` the user doesn't own.
   - *Target*: `/products/{pid}` (create)
5. **Price Poisoning**: Update an existing product price to a negative value or an extremely large string.
   - *Target*: `/products/{pid}` (update)
6. **Shadow Order**: Create an `Order` where `customerUid` matches another user's ID.
   - *Target*: `/orders/{oid}` (create)
7. **Order Amount Hijack**: Update the `totalAmount` of a `confirmed` order as a client.
   - *Target*: `/orders/{oid}` (update)
8. **Terminal State Break**: Attempt to change the items of an order that is already `delivered`.
   - *Target*: `/orders/{oid}` (update)
9. **Zone Sabotage**: Change delivery zone status to `closed` as a regular client.
   - *Target*: `/zones/{zid}` (update)
10. **Timestamp Fraud**: Set `createdAt` to a date in the past instead of `request.time`.
    - *Target*: Any collection (create)
11. **Malicious ID Injection**: Create a document with a 2KB junk character string as ID.
    - *Target*: `/products/{pid}` (create)
12. **Blind List Scrape**: Query `/orders` collection without a `where('customerUid', '==', uid)` filter as a client.
    - *Target*: `/orders` (list)

## 3. Test Runner (Security Verifier)
The rules will be validated using the `firestore.rules.test.ts` (conceptual for this environment, enforced via logic audit).
All payloads above MUST return `PERMISSION_DENIED`.
