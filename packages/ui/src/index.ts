/**
 * @fileoverview UI components for V-COMM
 * @module @vcomm/ui
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Button variant
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Avatar size
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Input size
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Badge variant
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Status indicator
 */
export type StatusType = 'online' | 'idle' | 'dnd' | 'offline';

/**
 * Base component props
 */
export interface BaseProps {
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Button props
 */
export interface ButtonProps extends BaseProps {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Children */
  children?: React.ReactNode;
}

/**
 * Avatar props
 */
export interface AvatarProps extends BaseProps {
  /** Image source */
  src?: string;
  /** Alt text */
  alt?: string;
  /** Fallback text (initials) */
  fallback?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Status indicator */
  status?: StatusType;
  /** Shape */
  shape?: 'circle' | 'square';
}

/**
 * Input props
 */
export interface InputProps extends BaseProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  /** Input size */
  size?: InputSize;
  /** Placeholder */
  placeholder?: string;
  /** Value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read only */
  readOnly?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label */
  label?: string;
  /** Required */
  required?: boolean;
  /** On change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** On focus handler */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** On blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Badge props
 */
export interface BadgeProps extends BaseProps {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Dot indicator */
  dot?: boolean;
  /** Children */
  children?: React.ReactNode;
}

/**
 * Status indicator props
 */
export interface StatusIndicatorProps extends BaseProps {
  /** Status type */
  status: StatusType;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show label */
  showLabel?: boolean;
}

/**
 * Voice channel props
 */
export interface VoiceChannelProps extends BaseProps {
  /** Channel name */
  name: string;
  /** Connected users */
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    speaking?: boolean;
    muted?: boolean;
    deafened?: boolean;
  }>;
  /** User limit */
  userLimit?: number;
  /** Bitrate */
  bitrate?: number;
  /** On join handler */
  onJoin?: () => void;
  /** On leave handler */
  onLeave?: () => void;
  /** Is connected */
  isConnected?: boolean;
}

/**
 * Message props
 */
export interface MessageProps extends BaseProps {
  /** Author name */
  author: string;
  /** Author avatar */
  avatar?: string;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date | string | number;
  /** Is edited */
  edited?: boolean;
  /** Is mentioned */
  mentioned?: boolean;
  /** Reactions */
  reactions?: Array<{
    emoji: string;
    count: number;
    reacted?: boolean;
  }>;
  /** On reaction handler */
  onReact?: (emoji: string) => void;
}

/**
 * User list props
 */
export interface UserListProps extends BaseProps {
  /** Users */
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: StatusType;
    statusMessage?: string;
  }>;
  /** On user click */
  onUserClick?: (userId: string) => void;
}

/**
 * Modal props
 */
export interface ModalProps extends BaseProps {
  /** Open state */
  open: boolean;
  /** On close handler */
  onClose: () => void;
  /** Title */
  title?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Children */
  children: React.ReactNode;
}

/**
 * Tooltip props
 */
export interface TooltipProps extends BaseProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Position */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay in ms */
  delay?: number;
  /** Children (trigger element) */
  children: React.ReactElement;
}

/**
 * Progress bar props
 */
export interface ProgressBarProps extends BaseProps {
  /** Progress value (0-100) */
  value: number;
  /** Max value */
  max?: number;
  /** Show label */
  showLabel?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * Slider props
 */
export interface SliderProps extends BaseProps {
  /** Value */
  value: number;
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
  /** Step */
  step?: number;
  /** Disabled */
  disabled?: boolean;
  /** Show value */
  showValue?: boolean;
  /** On change */
  onChange?: (value: number) => void;
}

/**
 * Toggle props
 */
export interface ToggleProps extends BaseProps {
  /** Checked state */
  checked: boolean;
  /** Disabled */
  disabled?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** On change */
  onChange?: (checked: boolean) => void;
}

/**
 * Dropdown props
 */
export interface DropdownProps<T = string> extends BaseProps {
  /** Options */
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  /** Selected value */
  value?: T;
  /** Placeholder */
  placeholder?: string;
  /** Disabled */
  disabled?: boolean;
  /** On change */
  onChange?: (value: T) => void;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

/**
 * Button component
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  style,
  testId,
  children,
}) => {
  const baseClasses = 'vcomm-button';
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'vcomm-button--primary',
    secondary: 'vcomm-button--secondary',
    danger: 'vcomm-button--danger',
    ghost: 'vcomm-button--ghost',
    link: 'vcomm-button--link',
  };
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'vcomm-button--sm',
    md: 'vcomm-button--md',
    lg: 'vcomm-button--lg',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'vcomm-button--full-width' : '',
    loading ? 'vcomm-button--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      data-testid={testId}
    >
      {loading && <span className="vcomm-button__spinner" />}
      <span className={loading ? 'vcomm-button__content--hidden' : ''}>{children}</span>
    </button>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

/**
 * Avatar component
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback,
  size = 'md',
  status,
  shape = 'circle',
  className = '',
  style,
  testId,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const baseClasses = 'vcomm-avatar';
  const sizeClasses: Record<AvatarSize, string> = {
    xs: 'vcomm-avatar--xs',
    sm: 'vcomm-avatar--sm',
    md: 'vcomm-avatar--md',
    lg: 'vcomm-avatar--lg',
    xl: 'vcomm-avatar--xl',
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    shape === 'square' ? 'vcomm-avatar--square' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showFallback = !src || imgError;

  return (
    <div className={classes} style={style} data-testid={testId}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className="vcomm-avatar__image"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="vcomm-avatar__fallback">{fallback || alt.charAt(0).toUpperCase()}</span>
      )}
      {status && (
        <span className={`vcomm-avatar__status vcomm-avatar__status--${status}`} />
      )}
    </div>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

/**
 * Input component
 */
export const Input: React.FC<InputProps> = ({
  type = 'text',
  size = 'md',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  error = false,
  errorMessage,
  label,
  required = false,
  onChange,
  onFocus,
  onBlur,
  className = '',
  style,
  testId,
}) => {
  const inputId = React.useId();

  const baseClasses = 'vcomm-input-wrapper';
  const sizeClasses: Record<InputSize, string> = {
    sm: 'vcomm-input-wrapper--sm',
    md: 'vcomm-input-wrapper--md',
    lg: 'vcomm-input-wrapper--lg',
  };

  const wrapperClasses = [
    baseClasses,
    sizeClasses[size],
    error ? 'vcomm-input-wrapper--error' : '',
    disabled ? 'vcomm-input-wrapper--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} style={style} data-testid={testId}>
      {label && (
        <label htmlFor={inputId} className="vcomm-input__label">
          {label}
          {required && <span className="vcomm-input__required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className="vcomm-input"
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? `${inputId}-error` : undefined}
      />
      {error && errorMessage && (
        <span id={`${inputId}-error`} className="vcomm-input__error">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

/**
 * Badge component
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  dot = false,
  className = '',
  style,
  testId,
  children,
}) => {
  const baseClasses = 'vcomm-badge';
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'vcomm-badge--default',
    success: 'vcomm-badge--success',
    warning: 'vcomm-badge--warning',
    danger: 'vcomm-badge--danger',
    info: 'vcomm-badge--info',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    dot ? 'vcomm-badge--dot' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} style={style} data-testid={testId}>
      {dot && <span className="vcomm-badge__dot" />}
      {children}
    </span>
  );
};

// ============================================================================
// STATUS INDICATOR COMPONENT
// ============================================================================

/**
 * Status indicator component
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = '',
  style,
  testId,
}) => {
  const baseClasses = 'vcomm-status';
  const sizeClasses = {
    sm: 'vcomm-status--sm',
    md: 'vcomm-status--md',
    lg: 'vcomm-status--lg',
  };

  const classes = [
    baseClasses,
    `vcomm-status--${status}`,
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labels: Record<StatusType, string> = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
  };

  return (
    <span className={classes} style={style} data-testid={testId}>
      <span className="vcomm-status__dot" />
      {showLabel && <span className="vcomm-status__label">{labels[status]}</span>}
    </span>
  );
};

// ============================================================================
// VOICE CHANNEL COMPONENT
// ============================================================================

/**
 * Voice channel component
 */
export const VoiceChannel: React.FC<VoiceChannelProps> = ({
  name,
  users,
  userLimit,
  bitrate,
  onJoin,
  onLeave,
  isConnected = false,
  className = '',
  style,
  testId,
}) => {
  const baseClasses = 'vcomm-voice-channel';
  const classes = [
    baseClasses,
    isConnected ? 'vcomm-voice-channel--connected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const formatBitrate = (bps: number): string => {
    if (bps >= 1000) return `${Math.floor(bps / 1000)} kbps`;
    return `${bps} bps`;
  };

  return (
    <div className={classes} style={style} data-testid={testId}>
      <div className="vcomm-voice-channel__header">
        <span className="vcomm-voice-channel__icon">🔊</span>
        <span className="vcomm-voice-channel__name">{name}</span>
        {userLimit && (
          <span className="vcomm-voice-channel__limit">
            {users.length}/{userLimit}
          </span>
        )}
      </div>

      {bitrate && (
        <div className="vcomm-voice-channel__info">
          <span className="vcomm-voice-channel__bitrate">{formatBitrate(bitrate)}</span>
        </div>
      )}

      {users.length > 0 && (
        <div className="vcomm-voice-channel__users">
          {users.map((user) => (
            <div key={user.id} className="vcomm-voice-channel__user">
              <Avatar
                src={user.avatar}
                fallback={user.name}
                size="sm"
                status={user.speaking ? 'online' : undefined}
              />
              <span className="vcomm-voice-channel__username">{user.name}</span>
              {user.muted && <span className="vcomm-voice-channel__icon-muted">🔇</span>}
              {user.deafened && <span className="vcomm-voice-channel__icon-deafened"> headphone slash</span>}
            </div>
          ))}
        </div>
      )}

      <div className="vcomm-voice-channel__actions">
        {isConnected ? (
          <Button variant="danger" size="sm" onClick={onLeave}>
            Leave
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onJoin}
            disabled={userLimit !== undefined && users.length >= userLimit}
          >
            Join
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MESSAGE COMPONENT
// ============================================================================

/**
 * Message component
 */
export const Message: React.FC<MessageProps> = ({
  author,
  avatar,
  content,
  timestamp,
  edited = false,
  mentioned = false,
  reactions = [],
  onReact,
  className = '',
  style,
  testId,
}) => {
  const baseClasses = 'vcomm-message';
  const classes = [
    baseClasses,
    mentioned ? 'vcomm-message--mentioned' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const formatTime = (time: Date | string | number): string => {
    const date = typeof time === 'string' || typeof time === 'number' ? new Date(time) : time;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={classes} style={style} data-testid={testId}>
      <div className="vcomm-message__avatar">
        <Avatar src={avatar} fallback={author} size="md" />
      </div>
      <div className="vcomm-message__content">
        <div className="vcomm-message__header">
          <span className="vcomm-message__author">{author}</span>
          <span className="vcomm-message__timestamp">
            {formatTime(timestamp)}
            {edited && <span className="vcomm-message__edited">(edited)</span>}
          </span>
        </div>
        <div className="vcomm-message__body">{content}</div>
        {reactions.length > 0 && (
          <div className="vcomm-message__reactions">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                className={`vcomm-message__reaction ${reaction.reacted ? 'vcomm-message__reaction--active' : ''}`}
                onClick={() => onReact?.(reaction.emoji)}
              >
                <span className="vcomm-message__reaction-emoji">{reaction.emoji}</span>
                <span className="vcomm-message__reaction-count">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// USER LIST COMPONENT
// ============================================================================

/**
 * User list component
 */
export const UserList: React.FC<UserListProps> = ({
  users,
  onUserClick,
  className = '',
  style,
  testId,
}) => {
  const baseClasses = 'vcomm-user-list';
  const classes = [baseClasses, className].filter(Boolean).join(' ');

  const groupedUsers = users.reduce(
    (groups, user) => {
      const group = user.status === 'online' ? 'online' : 'offline';
      if (!groups[group]) groups[group] = [];
      groups[group].push(user);
      return groups;
    },
    {} as Record<string, typeof users>
  );

  return (
    <div className={classes} style={style} data-testid={testId}>
      {groupedUsers.online && groupedUsers.online.length > 0 && (
        <div className="vcomm-user-list__group">
          <div className="vcomm-user-list__group-header">
            Online — {groupedUsers.online.length}
          </div>
          {groupedUsers.online.map((user) => (
            <button
              key={user.id}
              className="vcomm-user-list__user"
              onClick={() => onUserClick?.(user.id)}
            >
              <Avatar src={user.avatar} fallback={user.name} size="sm" status={user.status} />
              <div className="vcomm-user-list__user-info">
                <span className="vcomm-user-list__user-name">{user.name}</span>
                {user.statusMessage && (
                  <span className="vcomm-user-list__user-status">{user.statusMessage}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {groupedUsers.offline && groupedUsers.offline.length > 0 && (
        <div className="vcomm-user-list__group">
          <div className="vcomm-user-list__group-header">
            Offline — {groupedUsers.offline.length}
          </div>
          {groupedUsers.offline.map((user) => (
            <button
              key={user.id}
              className="vcomm-user-list__user vcomm-user-list__user--offline"
              onClick={() => onUserClick?.(user.id)}
            >
              <Avatar src={user.avatar} fallback={user.name} size="sm" status={user.status} />
              <span className="vcomm-user-list__user-name">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================

/**
 * Modal component
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'md',
  children,
  className = '',
  style,
  testId,
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const baseClasses = 'vcomm-modal';
  const sizeClasses = {
    sm: 'vcomm-modal--sm',
    md: 'vcomm-modal--md',
    lg: 'vcomm-modal--lg',
    xl: 'vcomm-modal--xl',
  };

  const classes = [baseClasses, sizeClasses[size], className].filter(Boolean).join(' ');

  return (
    <div className="vcomm-modal-overlay" onClick={onClose}>
      <div
        className={classes}
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-testid={testId}
      >
        {title && (
          <div className="vcomm-modal__header">
            <h2 className="vcomm-modal__title">{title}</h2>
            <button className="vcomm-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        )}
        <div className="vcomm-modal__content">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

/**
 * Progress bar component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'default',
  className = '',
  style,
  testId,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const baseClasses = 'vcomm-progress';
  const sizeClasses = {
    sm: 'vcomm-progress--sm',
    md: 'vcomm-progress--md',
    lg: 'vcomm-progress--lg',
  };
  const variantClasses = {
    default: 'vcomm-progress--default',
    success: 'vcomm-progress--success',
    warning: 'vcomm-progress--warning',
    danger: 'vcomm-progress--danger',
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} data-testid={testId}>
      <div className="vcomm-progress__track">
        <div className="vcomm-progress__fill" style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && (
        <span className="vcomm-progress__label">{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

/**
 * Slider component
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  onChange,
  className = '',
  style,
  testId,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const baseClasses = 'vcomm-slider';
  const classes = [
    baseClasses,
    disabled ? 'vcomm-slider--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} data-testid={testId}>
      <div className="vcomm-slider__track">
        <div className="vcomm-slider__fill" style={{ width: `${percentage}%` }} />
        <input
          type="range"
          className="vcomm-slider__input"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
      {showValue && <span className="vcomm-slider__value">{value}</span>}
    </div>
  );
};

// ============================================================================
// TOGGLE COMPONENT
// ============================================================================

/**
 * Toggle component
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  disabled = false,
  size = 'md',
  onChange,
  className = '',
  style,
  testId,
}) => {
  const handleClick = () => {
    if (!disabled) onChange?.(!checked);
  };

  const baseClasses = 'vcomm-toggle';
  const sizeClasses = {
    sm: 'vcomm-toggle--sm',
    md: 'vcomm-toggle--md',
    lg: 'vcomm-toggle--lg',
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    checked ? 'vcomm-toggle--checked' : '',
    disabled ? 'vcomm-toggle--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={classes}
      style={style}
      disabled={disabled}
      onClick={handleClick}
      data-testid={testId}
    >
      <span className="vcomm-toggle__thumb" />
    </button>
  );
};

// ============================================================================
// DROPDOWN COMPONENT
// ============================================================================

/**
 * Dropdown component
 */
export function Dropdown<T = string>({
  options,
  value,
  placeholder = 'Select...',
  disabled = false,
  onChange,
  className = '',
  style,
  testId,
}: DropdownProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseClasses = 'vcomm-dropdown';
  const classes = [
    baseClasses,
    isOpen ? 'vcomm-dropdown--open' : '',
    disabled ? 'vcomm-dropdown--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={classes} style={style} data-testid={testId}>
      <button
        type="button"
        className="vcomm-dropdown__trigger"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? '' : 'vcomm-dropdown__placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="vcomm-dropdown__arrow">▼</span>
      </button>
      {isOpen && (
        <div className="vcomm-dropdown__menu">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`vcomm-dropdown__option ${option.value === value ? 'vcomm-dropdown__option--selected' : ''}`}
              disabled={option.disabled}
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
  Dropdown,
};