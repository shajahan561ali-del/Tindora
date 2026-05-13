# Trendora Security Specification

## Data Invariants
1. A video must have a valid `creatorId` matching the authenticated user during creation.
2. Users can only modify their own metadata (bio, username, photoURL).
3. `coins` can be incremented for view rewards, but should be strictly monitored (e.g., small increments).
4. Gifting requires a transaction that deducts from one user and adds to another, while recording both sides.
5. Followers/Following counts must be mirrored by the existence of follow documents.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Create a video with `creatorId` of another user.
2. **Account Takeover**: Update `email` or `uid` of another user's profile.
3. **Coin Theft**: Update another user's `coins` field directly.
4. **Infinite Coins**: Update own `coins` field by a massive amount (e.g., 1,000,000).
5. **Ghost Following**: Create a `follower` record in another user's subcollection without being the follower.
6. **Reward Forgery**: Create a `reward` record with `type: "gift_received"` but a huge amount, without a corresponding `gift_sent`.
7. **Negative Gifting**: Send a gift with a negative amount to drain a creator's coins.
8. **Subcollection Injection**: Write junk data into `users/{userId}/rewards/junk`.
9. **Timestamp Manipulation**: Set `createdAt` to a future date.
10. **Shadow Fields**: Add `isAdmin: true` to own user profile.
11. **Malicious ID Injection**: Create a video with a 2KB long string as ID.
12. **Bypass Transaction**: Increment own coins without any reward record.

## Test Runner (firestore.rules.test.ts)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, getDoc, updateDoc, deleteDoc, collection, doc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "trendora-test",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Identity Spoofing: fail to create video for another user", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(setDoc(doc(alice.firestore(), "videos", "v1"), {
    creatorId: "bob",
    videoUrl: "http://test.com",
    createdAt: new Date()
  }));
});

test("Coin Theft: fail to update another user's coins", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(updateDoc(doc(alice.firestore(), "users", "bob"), {
    coins: 1000
  }));
});

test("Timestamp Manipulation: fail to set future createdAt", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(setDoc(doc(alice.firestore(), "users", "alice"), {
    uid: "alice",
    username: "alice",
    email: "alice@test.com",
    coins: 0,
    createdAt: new Date(Date.now() + 1000000)
  }));
});
```
