/**
 * Password strength indicator module
 * Demonstrates conditional script loading
 */

export class PasswordStrength {
    constructor(passwordSelector = '#password') {
        this.passwordInput = document.querySelector(passwordSelector);
        this.strengthMeter = null;
        this.init();
    }
    
    init() {
        if (!this.passwordInput) return;
        
        this.createStrengthMeter();
        this.passwordInput.addEventListener('input', () => this.updateStrength());
    }
    
    createStrengthMeter() {
        const container = document.createElement('div');
        container.className = 'password-strength-meter';
        container.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text">Enter a password</div>
        `;
        
        this.passwordInput.parentNode.insertBefore(container, this.passwordInput.nextSibling);
        this.strengthMeter = container;
    }
    
    updateStrength() {
        const password = this.passwordInput.value;
        const strength = this.calculateStrength(password);
        const fill = this.strengthMeter.querySelector('.strength-fill');
        const text = this.strengthMeter.querySelector('.strength-text');
        
        // Update visual indicator
        fill.style.width = `${strength.score * 20}%`;
        fill.className = `strength-fill strength-${strength.level}`;
        text.textContent = strength.message;
        
        // Update accessibility
        this.strengthMeter.setAttribute('aria-label', `Password strength: ${strength.message}`);
    }
    
    calculateStrength(password) {
        if (password.length === 0) {
            return { score: 0, level: 'empty', message: 'Enter a password' };
        }
        
        let score = 0;
        const checks = [
            { test: /[a-z]/, points: 1 },
            { test: /[A-Z]/, points: 1 },
            { test: /[0-9]/, points: 1 },
            { test: /[^A-Za-z0-9]/, points: 1 },
            { test: /.{8,}/, points: 1 }
        ];
        
        checks.forEach(check => {
            if (check.test.test(password)) {
                score += check.points;
            }
        });
        
        const levels = [
            { min: 0, level: 'very-weak', message: 'Very weak' },
            { min: 1, level: 'weak', message: 'Weak' },
            { min: 2, level: 'fair', message: 'Fair' },
            { min: 3, level: 'good', message: 'Good' },
            { min: 4, level: 'strong', message: 'Strong' }
        ];
        
        const level = levels.filter(l => score >= l.min).pop();
        
        return { score, level: level.level, message: level.message };
    }
}

// Only initialize if password field exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#password')) {
        new PasswordStrength();
    }
});