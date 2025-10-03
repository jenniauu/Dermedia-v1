document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const btnSignin = document.querySelector("#signin");
    const btnSignup = document.querySelector("#signup");
    const body = document.querySelector("body");
    const forms = document.querySelectorAll(".form");
    
    // Transição entre formulários
    btnSignin.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector('.first-content .first-column').style.opacity = '0';
        
        setTimeout(() => {
            body.classList.remove("sign-up-js");
            body.classList.add("sign-in-js"); 
            
            setTimeout(() => {
                document.querySelector('.second-content .first-column').style.opacity = '1';
            }, 700);
        }, 50);
    });
    
    btnSignup.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector('.second-content .first-column').style.opacity = '0';
        
        setTimeout(() => {
            body.classList.remove("sign-in-js");
            body.classList.add("sign-up-js");
            
            setTimeout(() => {
                document.querySelector('.first-content .first-column').style.opacity = '1';
            }, 700);
        }, 50);
    });
    
    // Validação de formulário (apenas UI)
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) e.preventDefault();
        });
        
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
    
    function validateField(field) {
        // Validação visual apenas
    }
    
    function validateForm(form) {
        // Validação visual apenas
        return true;
    }
});

