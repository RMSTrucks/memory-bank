# React Components Library

## Common Components

### 1. Button Component
```jsx
// Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
```

### 2. Form Input Component
```jsx
// FormInput.jsx
import React from 'react';
import PropTypes from 'prop-types';

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  error = '',
  required = false,
  placeholder = '',
}) => {
  const inputId = `input-${name}`;
  
  return (
    <div className="form-group">
      <label htmlFor={inputId}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        required={required}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default FormInput;
```

### 3. Loading Spinner
```jsx
// LoadingSpinner.jsx
import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `text-${color}`;
  
  return (
    <div className={`spinner-border ${sizeClass} ${colorClass}`} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger']),
};

export default LoadingSpinner;
```

## Usage Examples

### Basic Button Usage
```jsx
import Button from './components/Button';

function MyComponent() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div>
      <Button onClick={handleClick} variant="primary" size="medium">
        Click Me
      </Button>
      
      <Button variant="danger" disabled>
        Disabled Button
      </Button>
    </div>
  );
}
```

### Form Input Usage
```jsx
import FormInput from './components/FormInput';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form>
      <FormInput
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        type="email"
        required
      />
      
      <FormInput
        label="Password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        type="password"
        required
      />
    </form>
  );
}
```

## Styling

### Base Styles
```scss
// components.scss
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &-primary {
    background-color: #007bff;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: darken(#007bff, 10%);
    }
  }
  
  // Add other variant styles...
}

.form-group {
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .form-control {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    
    &.is-invalid {
      border-color: #dc3545;
    }
  }
  
  .invalid-feedback {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
}
```

## Best Practices

1. **Component Organization**
   - One component per file
   - Clear, descriptive names
   - Consistent prop patterns
   - PropTypes validation

2. **Performance**
   - Memoize when needed
   - Avoid unnecessary renders
   - Optimize event handlers
   - Use proper key props

3. **Accessibility**
   - Semantic HTML
   - ARIA attributes
   - Keyboard navigation
   - Color contrast

## Cross-References
- [Error Handling Patterns](../../../patterns/coding/error-handling.md)
- [React Project Template](../../../templates/project/web-app.md)
- [Testing Strategies](../../../patterns/coding/testing-strategies.md)
