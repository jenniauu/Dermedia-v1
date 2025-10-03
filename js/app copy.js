// app.js melhorado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const btnSignin = document.querySelector("#signin");
    const btnSignup = document.querySelector("#signup");
    const body = document.querySelector("body");
    const forms = document.querySelectorAll(".form");
    
    // Transição entre formulários - Versão final
    btnSignin.addEventListener("click", function (e) {
        e.preventDefault();
        
        // Esconde APENAS o texto da coluna esquerda (cadastro)
        document.querySelector('.first-content .first-column').style.opacity = '0';
        
        // Inicia a transição após pequeno delay
        setTimeout(() => {
            body.classList.remove("sign-up-js");
            body.classList.add("sign-in-js"); 
            
            // Restaura a opacidade após a transição
            setTimeout(() => {
                document.querySelector('.second-content .first-column').style.opacity = '1';
            }, 700);
        }, 50);
    });
    
    btnSignup.addEventListener("click", function (e) {
        e.preventDefault();
        
        // Esconde APENAS o texto da coluna esquerda (login)
        document.querySelector('.second-content .first-column').style.opacity = '0';
        
        // Inicia a transição após pequeno delay
        setTimeout(() => {
            body.classList.remove("sign-in-js");
            body.classList.add("sign-up-js");
            
            // Restaura a opacidade após a transição
            setTimeout(() => {
                document.querySelector('.first-content .first-column').style.opacity = '1';
            }, 700);
        }, 50);
    });
    
    // Validação de formulário (mantido do original)
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
        
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
    
    function validateField(field) {
        // Implementar validação por tipo de campo
    }
    
    function validateForm(form) {
        // Implementar validação completa
        return true;
    }
});

//FIREBASE

const firebaseConfig = {
    apiKey: "AIzaSyAjZ06gKXpo8Aazop8o-OXJvsch7QKpz4c",
    authDomain: "dermedia-d5a68.firebaseapp.com",
    projectId: "dermedia-d5a68",
    storageBucket: "dermedia-d5a68.firebasestorage.app",
    messagingSenderId: "231595854095",
    appId: "1:231595854095:web:c846367601267d06c7d67a"
  };

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Verifica se o usuário está logado
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado, redireciona para dashboard
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('cadastro.html')) {
            window.location.href = "dashboard.html";
        }
    } else {
        // Usuário não logado, redireciona para login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

// Login com email/senha
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("errorMessage");

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                errorMessage.textContent = "E-mail ou senha incorretos. Por favor, tente novamente.";
                errorMessage.style.display = "block";
            });
    });
}

// Login com Google
if (document.getElementById("googleLogin")) {
    document.getElementById("googleLogin").addEventListener("click", () => {
        auth.signInWithPopup(provider)
            .then(() => {
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                const errorMessage = document.getElementById("errorMessage") || 
                                      document.createElement("div");
                errorMessage.textContent = "Erro ao conectar com Google. Tente novamente.";
                errorMessage.style.display = "block";
            });
    });
}


// Recuperação de senha
document.getElementById("forgotPassword").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("passwordResetModal").style.display = "block";  
});

document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("passwordResetModal").style.display = "none";
});

document.getElementById("passwordResetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value;
    const errorMessage = document.getElementById("resetErrorMessage");

    errorMessage.style.display = "none";

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
            document.getElementById("passwordResetModal").style.display = "none";
        })
        .catch((error) => {
            errorMessage.textContent = "Erro ao enviar e-mail. Verifique se o e-mail está correto.";
            errorMessage.style.display = "block";
        });
});

// Cadastro com e-mail/senha
document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMessage = document.getElementById("regErrorMessage");

    errorMessage.style.display = "none";

    if (password !== confirmPassword) {
        errorMessage.textContent = "As senhas não coincidem!";
        errorMessage.style.display = "block";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
        // Redireciona para login com mensagem de sucesso
        window.location.href = "login.html?success=Cadastro realizado com sucesso! Faça login para continuar.";
    })
        .catch((error) => {
            let errorMsg = "Erro ao cadastrar. Tente novamente.";
            if (error.code === "auth/email-already-in-use") {
                errorMsg = "Este e-mail já está em uso.";
            } else if (error.code === "auth/weak-password") {
                errorMsg = "A senha deve ter pelo menos 6 caracteres.";
            }
            errorMessage.textContent = errorMsg;
            errorMessage.style.display = "block";
        });
});