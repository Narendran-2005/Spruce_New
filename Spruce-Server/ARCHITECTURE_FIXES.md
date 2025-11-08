# Architecture Fixes - Spruce Server

This document outlines all the architectural issues that were identified and fixed.

## ✅ Issues Fixed

### 1. Circular Dependency Resolved
**Problem:** `JwtAuthenticationFilter → UserService → SecurityConfig → JwtAuthenticationFilter`

**Solution:**
- Removed `UserService` dependency from `JwtAuthenticationFilter`
- `JwtAuthenticationFilter` now uses `UserRepository` directly
- This breaks the circular dependency chain

**Files Changed:**
- `JwtAuthenticationFilter.java` - Now uses `UserRepository` instead of `UserService`

### 2. Improper Bean Injection Fixed
**Problem:** `JwtAuthenticationFilter` was both a `@Component` and autowired in `SecurityConfig`

**Solution:**
- Removed `@Component` annotation from `JwtAuthenticationFilter`
- Created `JwtAuthenticationFilter` as a `@Bean` in `SecurityConfig`
- Filter is now properly managed by Spring's configuration

**Files Changed:**
- `JwtAuthenticationFilter.java` - Removed `@Component`
- `SecurityConfig.java` - Added `@Bean` method for filter creation

### 3. PasswordEncoder Separation
**Problem:** `PasswordEncoder` bean was defined in `SecurityConfig`, causing tight coupling

**Solution:**
- Created separate `SecurityBeansConfig` class
- Moved `PasswordEncoder` bean definition to `SecurityBeansConfig`
- Improves separation of concerns

**Files Changed:**
- `SecurityBeansConfig.java` - New file with `PasswordEncoder` bean
- `SecurityConfig.java` - Removed `PasswordEncoder` bean

### 4. Constructor Injection Implemented
**Problem:** All classes used `@Autowired` field injection, which:
- Hides circular dependencies
- Makes testing difficult
- Violates Spring best practices

**Solution:**
- Converted all `@Autowired` field injection to constructor injection
- All dependencies are now `final` and injected via constructor
- Better testability and explicit dependencies

**Files Changed:**
- `JwtAuthenticationFilter.java`
- `SecurityConfig.java`
- `UserService.java`
- `AuthService.java`
- `JwtService.java`
- `AuthController.java`
- `ContactController.java`
- `UserController.java`
- `MessageController.java`
- `GroupController.java`
- `SpruceWebSocketHandler.java`
- `WebSocketConfig.java`

### 5. H2 Database Persistence Fixed
**Problem:** Using in-memory H2 (`jdbc:h2:mem:`) causes data loss on restart

**Solution:**
- Changed to file-based H2: `jdbc:h2:file:./data/spruce_db`
- Added `DB_CLOSE_DELAY=-1` to keep connections alive
- Added `DB_CLOSE_ON_EXIT=FALSE` to prevent auto-shutdown
- Added `AUTO_SERVER=TRUE` for multiple connections

**Files Changed:**
- `application.properties` - Updated H2 connection URL

**Note:** Database file will be created in `./data/spruce_db.mv.db` directory

### 6. Group Foreign Key Constraint
**Problem:** `group_members` table only had foreign key for `group_id`, not `user_id`

**Solution:**
- Added `@ForeignKey` annotation to `@CollectionTable`
- Properly defines foreign key constraint for `group_id`

**Files Changed:**
- `Group.java` - Added `@ForeignKey` annotation

**Note:** `user_id` in `group_members` is stored as a `Long` value (not a foreign key) due to `@ElementCollection` design. For a proper foreign key to `users` table, a separate `GroupMember` entity with `@ManyToOne` would be required.

### 7. DevTools Configuration
**Problem:** DevTools automatic restarts could trigger circular dependency errors

**Solution:**
- Added exclusion for security config classes from DevTools restart
- Prevents hot reload issues with security configuration

**Files Changed:**
- `application.properties` - Added `spring.devtools.restart.exclude`

### 8. Tight Coupling Reduced
**Problem:** Security layer depended directly on business service (`UserService`)

**Solution:**
- Security filter now uses repository layer directly
- Better separation between security and business logic
- Follows dependency inversion principle

## 📋 Architecture Improvements Summary

| Issue | Status | Impact |
|-------|--------|--------|
| Circular Dependency | ✅ Fixed | High - Prevents startup failures |
| Bean Injection | ✅ Fixed | High - Prevents duplicate beans |
| PasswordEncoder Coupling | ✅ Fixed | Medium - Better separation |
| Field Injection | ✅ Fixed | Medium - Better testability |
| H2 Persistence | ✅ Fixed | High - Data survives restarts |
| Foreign Keys | ✅ Partially Fixed | Low - Design limitation |
| DevTools | ✅ Fixed | Low - Development experience |
| Tight Coupling | ✅ Fixed | Medium - Better architecture |

## 🔍 Remaining Considerations

### Group Members Foreign Key
The current design uses `@ElementCollection` with `Set<Long>` for member IDs. This means:
- `user_id` values are stored as simple Long values
- No foreign key constraint to `users` table
- No referential integrity at database level

**Future Improvement:**
Create a `GroupMember` entity:
```java
@Entity
@Table(name = "group_members")
public class GroupMember {
    @Id
    @GeneratedValue
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
```

This would provide:
- Proper foreign key constraints
- Referential integrity
- Better query capabilities

## 🧪 Testing Recommendations

After these fixes, verify:
1. ✅ Application starts without circular dependency errors
2. ✅ JWT authentication works correctly
3. ✅ WebSocket connections authenticate properly
4. ✅ Database persists data across restarts
5. ✅ No duplicate bean creation warnings
6. ✅ DevTools hot reload works without errors

## 📝 Migration Notes

If upgrading from the old version:
1. Database schema will be updated automatically (Hibernate `ddl-auto=update`)
2. No data migration needed for H2 (if switching from in-memory to file-based, data will be lost)
3. All existing functionality should work the same
4. Better error messages if dependencies are missing

## 🚀 Performance Impact

- **Positive:** Constructor injection is slightly faster than field injection
- **Neutral:** File-based H2 has same performance as in-memory for small datasets
- **Positive:** No circular dependency resolution overhead

## 🔒 Security Impact

- **Improved:** Better separation of concerns makes security layer more maintainable
- **Improved:** Explicit dependencies reduce risk of injection issues
- **No Change:** Security functionality remains the same

