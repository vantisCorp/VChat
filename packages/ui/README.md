# @vcomm/ui

React UI component library for V-COMM voice communication platform.

## Installation

```bash
npm install @vcomm/ui
# or
yarn add @vcomm/ui
# or
pnpm add @vcomm/ui
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom
```

## Usage

```tsx
import {
  Button,
  Avatar,
  Input,
  Badge,
  StatusIndicator,
  VoiceChannel,
  Message,
  UserList,
  Modal,
  ProgressBar,
  Slider,
  Toggle,
  Dropdown
} from '@vcomm/ui';

function App() {
  return (
    <div>
      <Button variant="primary" onClick={() => console.log('clicked')}>
        Click Me
      </Button>
      
      <Avatar
        src="https://example.com/avatar.png"
        fallback="JD"
        status="online"
        size="md"
      />
      
      <Input
        placeholder="Enter message..."
        onEnter={(value) => console.log(value)}
      />
    </div>
  );
}
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
```

### Avatar

User avatar with status indicator and fallback support.

```tsx
<Avatar src="https://example.com/avatar.png" fallback="JD" />
<Avatar fallback="AB" status="online" />
<Avatar fallback="CD" status="dnd" size="lg" />
```

### Input

Text input with keyboard event handling.

```tsx
<Input placeholder="Type something..." />
<Input type="password" placeholder="Password" />
<Input onEnter={(value) => handleSubmit(value)} />
```

### Badge

Status badges and labels.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="info">Info</Badge>
```

### StatusIndicator

Visual status indicator for user presence.

```tsx
<StatusIndicator status="online" />
<StatusIndicator status="idle" />
<StatusIndicator status="dnd" />
<StatusIndicator status="offline" />
```

### VoiceChannel

Voice channel UI with participant list.

```tsx
<VoiceChannel
  name="General Voice"
  participants={[
    { id: '1', username: 'user1', avatar: 'url', isMuted: false, isDeafened: false },
    { id: '2', username: 'user2', avatar: 'url', isMuted: true, isDeafened: false }
  ]}
  userLimit={10}
/>
```

### Message

Chat message component with reactions and actions.

```tsx
<Message
  id="msg-1"
  content="Hello, world!"
  author={{
    id: 'user-1',
    username: 'john_doe',
    avatar: 'https://example.com/avatar.png'
  }}
  timestamp={new Date()}
  reactions={[
    { emoji: '👍', count: 5, reacted: true }
  ]}
/>
```

### UserList

List of users with status indicators.

```tsx
<UserList
  users={[
    { id: '1', username: 'user1', status: 'online' },
    { id: '2', username: 'user2', status: 'idle' }
  ]}
  onUserClick={(user) => console.log(user)}
/>
```

### Modal

Modal dialog for overlays and forms.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### ProgressBar

Progress indicator for uploads and processes.

```tsx
<ProgressBar value={75} max={100} showLabel />
<ProgressBar value={50} variant="success" animated />
```

### Slider

Range slider for value selection.

```tsx
<Slider
  min={0}
  max={100}
  value={volume}
  onChange={setVolume}
  label="Volume"
/>
```

### Toggle

Switch toggle for boolean settings.

```tsx
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable notifications"
/>
```

### Dropdown

Dropdown menu for selections.

```tsx
<Dropdown
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={selected}
  onChange={setSelected}
  placeholder="Select an option"
/>
```

## Theming

Components support custom theming via CSS variables:

```css
:root {
  --vcomm-primary: #5865F2;
  --vcomm-secondary: #4752C4;
  --vcomm-danger: #ED4245;
  --vcomm-success: #57F287;
  --vcomm-warning: #FEE75C;
  --vcomm-info: #3498DB;
  --vcomm-bg-primary: #36393F;
  --vcomm-bg-secondary: #2F3136;
  --vcomm-text-primary: #FFFFFF;
  --vcomm-text-secondary: #B9BBBE;
  --vcomm-border: #202225;
}
```

## TypeScript

All components are fully typed with TypeScript. Type definitions are included in the package.

```tsx
import type {
  ButtonProps,
  AvatarProps,
  InputProps,
  BadgeProps,
  StatusIndicatorProps,
  VoiceChannelProps,
  MessageProps,
  UserListProps,
  ModalProps,
  ProgressBarProps,
  SliderProps,
  ToggleProps,
  DropdownProps
} from '@vcomm/ui';
```

## License

MIT