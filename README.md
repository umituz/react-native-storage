# @umituz/react-native-storage

Domain-Driven Design storage system for React Native apps with type-safe AsyncStorage operations.

## Installation

```bash
npm install @umituz/react-native-storage
```

## Peer Dependencies

- `react` >= 18.2.0
- `react-native` >= 0.74.0
- `@react-native-async-storage/async-storage` >= 1.21.0

## Features

- ✅ Domain-Driven Design (DDD) architecture
- ✅ Type-safe storage operations
- ✅ Result-based error handling
- ✅ React hooks for easy integration
- ✅ Storage key management utilities
- ✅ Automatic serialization/deserialization

## Usage

### Basic Usage with Hook

```typescript
import { useStorage, StorageKey } from '@umituz/react-native-storage';

const MyComponent = () => {
  const storage = useStorage();

  // Get item
  const value = await storage.getItem('my-key', 'default-value');

  // Set item
  await storage.setItem('my-key', 'my-value');

  // Remove item
  await storage.removeItem('my-key');

  // Clear all
  await storage.clear();
};
```

### Using Storage Keys

```typescript
import { StorageKey, createUserKey, createAppKey } from '@umituz/react-native-storage';

// Create typed storage keys
const userKey = createUserKey('preferences');
const appKey = createAppKey('settings');

// Use with storage
const storage = useStorage();
await storage.setItem(userKey, { theme: 'dark' });
```

### Using Storage State Hook

```typescript
import { useStorageState } from '@umituz/react-native-storage';

const MyComponent = () => {
  const [value, setValue, isLoading] = useStorageState('my-key', 'default');

  return (
    <View>
      <Text>{value}</Text>
      <Button onPress={() => setValue('new-value')} />
    </View>
  );
};
```

## API

### Hooks

- `useStorage()`: Main storage hook for CRUD operations
- `useStorageState(key, defaultValue)`: React state hook with storage persistence

### Utilities

- `StorageKey`: Type-safe storage key class
- `createUserKey(key)`: Create user-specific storage key
- `createAppKey(key)`: Create app-wide storage key

### Repository

- `storageRepository`: Direct access to storage repository
- `AsyncStorageRepository`: Repository implementation class

## License

MIT

