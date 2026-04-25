# Security Specification for SchoolBridge

## 1. Data Invariants
- A Student record must exist for every User with the role 'student'.
- Users can only read/write their own profiles.
- Teachers can read/write data for students in their assigned class.
- Parents can only read data for their linked student (by email).
- Messages can only be read by the sender or receiver.
- Help requests are visible to students (their own) and teachers (of their class).

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: User A trying to update User B's profile.
2. **Role Escalation**: Student trying to change their role to 'teacher'.
3. **Ghost Field Injection**: Adding `isAdmin: true` to a profile update.
4. **Orphaned Student**: Creating a student record without a valid linked User.
5. **Unauthorized Message Reading**: User C trying to read messages between A and B.
6. **Malicious ID**: Using a 1MB string as a document ID.
7. **Timestamp Spoofing**: Providing a past `createdAt` date instead of server time.
8. **Resource Exhaustion**: Sending a 1MB string in a `bio` field.
9. **Bypassing Relation**: Parent A trying to read Student B's grades (not their child).
10. **State Corruption**: Student resolving a help request they didn't create or that isn't their role.
11. **Shadow Message**: Sending a message as another user.
12. **Insecure List Query**: Attempting to list all users without filtering.

## 3. Implementation Plan
- Use `isValidId()` for all path variables.
- Use `isValidUser()`, `isValidStudent()`, `isValidMessage()`, etc.
- Enforce `affectedKeys().hasOnly()` for actions like `updateProfile`.
- Use `get()` to verify memberships (e.g., is this student in this teacher's class?).
- Use `request.time` for all timestamps.
