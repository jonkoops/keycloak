/**
 * Login form validator module
 * Demonstrates ES6 module usage with the new script registration system
 */

export class LoginFormValidator {
    constructor(formSelector = '#kc-form-login') {
        this.form = document.querySelector(formSelector);
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => this.validateForm(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateInput(input));
        });
    }
    
    validateForm(event) {
        const isValid = this.validateAllInputs();
        
        if (!isValid) {
            event.preventDefault();
            this.showErrorMessage('Please correct the errors above.');
        }
        
        return isValid;
    }
    
    validateInput(input) {
        const rules = this.getValidationRules(input);
        let isValid = true;
        
        for (const rule of rules) {
            if (!rule.test(input.value)) {
                this.showInputError(input, rule.message);
                isValid = false;
                break;
            }
        }
        
        if (isValid) {
            this.clearInputError(input);
        }
        
        return isValid;
    }
    
    getValidationRules(input) {
        const rules = [];
        
        if (input.hasAttribute('required')) {
            rules.push({
                test: (value) => value.trim().length > 0,
                message: 'This field is required.'
            });
        }
        
        if (input.type === 'email') {
            rules.push({
                test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'Please enter a valid email address.'
            });
        }
        
        if (input.name === 'password') {
            rules.push({
                test: (value) => value.length >= 8,
                message: 'Password must be at least 8 characters long.'
            });
        }
        
        return rules;
    }
    
    validateAllInputs() {
        const inputs = this.form.querySelectorAll('input[required]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                allValid = false;
            }
        });
        
        return allValid;
    }
    
    showInputError(input, message) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('error');
        
        let errorElement = input.parentNode.querySelector('.input-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'input-error';
            errorElement.setAttribute('aria-live', 'polite');
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    clearInputError(input) {
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('error');
        
        const errorElement = input.parentNode.querySelector('.input-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    showErrorMessage(message) {
        // Integration with Keycloak's message display system
        console.error('Form validation error:', message);
    }
}

// Auto-initialize when the module is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginFormValidator();
});