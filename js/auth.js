// Verifica se o Firebase está inicializado
if (!firebase.apps.length) {
    console.error("Firebase não foi inicializado!");
} else {
    console.log("Firebase está pronto para uso");
}

// Referências do Firebase
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();

// Função para salvar dados do usuário no Firestore
// auth.js
async function saveUserData(user, name = null) {
    try {
        const userData = {
            email: user.email,
            lastLogin: new Date(),
            provider: user.providerData[0]?.providerId || "email",
            uid: user.uid
        };

        // Se o cadastro for por email/senha e tiver nome
        if (name && name.trim() !== "") {
            userData.name = name.trim();

            // Atualiza também no Auth (displayName)
            await user.updateProfile({ displayName: name.trim() });
            console.log("DisplayName atualizado no Auth:", name);
            
            // Data de criação da conta
            userData.createdAt = new Date();
        }

        // Se for usuário do Google e tiver displayName
        if (!name && user.displayName) {
            userData.name = user.displayName;
        }

        console.log("Salvando dados no Firestore:", userData);
        await db.collection("logins").doc(user.uid).set(userData, { merge: true });
        console.log("Dados do usuário salvos com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar dados do usuário:", error);
    }
}


// Função para verificar autenticação
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        console.log("Estado da autenticação:", user ? "Logado" : "Deslogado");
        if (user && window.location.pathname.endsWith('cadastro.html')) {
            window.location.href = "perfil.html";  // Alterado para perfil.html
        }
    });
}

// CADASTRO
document.getElementById("registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Tentando cadastrar...");
    
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const name = document.getElementById("regName").value;
    const errorElement = document.getElementById("regErrorMessage");

    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        return saveUserData(user, name); // já atualiza displayName + Firestore
    })
    .then(() => {
        window.location.href = "perfil.html";
    })
    .catch((error) => {
        console.error("Erro no cadastro:", error);
        errorElement.textContent = `Erro: ${error.message}`;
        errorElement.style.display = "block";
    });

});

// LOGIN SEM GOOGLE
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorElement = document.getElementById("loginErrorMessage");

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Atualizar data do último login
            return saveUserData(userCredential.user);
        })
        .then((success) => {
            if (success) {
                window.location.href = "perfil.html";  // Alterado para perfil.html
            } else {
                // Mesmo com erro ao salvar dados, permite o login
                window.location.href = "perfil.html";
            }
        })
        .catch((error) => {
            errorElement.textContent = "E-mail ou senha incorretos";
            errorElement.style.display = "block";
        });
});

// LOGIN COM GOOGLE
["googleLogin", "googleLoginAlt"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", (e) => {
        e.preventDefault();
        auth.signInWithPopup(provider)
            .then((result) => {
                // Salvar dados do usuário do Google
                return saveUserData(result.user);
            })
            .then((success) => {
                window.location.href = "perfil.html";  // Alterado para perfil.html
            })
            .catch((error) => {
                console.error("Erro no login com Google:", error);
                alert("Erro ao fazer login com Google. Tente novamente.");
            });
    });
});

// RECUPERAÇÃO DE SENHA
document.getElementById("passwordResetForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value;
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("E-mail enviado com sucesso!");
            document.getElementById("passwordResetModal").style.display = "none";
        })
        .catch((error) => {
            document.getElementById("resetErrorMessage").textContent = error.message;
        });
});

// Gerenciamento do Modal de Recuperação
const passwordResetModal = document.getElementById("passwordResetModal");
const resetForm = document.getElementById("passwordResetForm");
const resetErrorElement = document.getElementById("resetErrorMessage");

// Abrir modal quando clicar em "Esqueceu sua senha"
document.getElementById("forgotPassword")?.addEventListener("click", (e) => {
    e.preventDefault();
    passwordResetModal.style.display = "block";
    resetErrorElement.textContent = "";
});

// Fechar modal
document.querySelector(".close")?.addEventListener("click", () => {
    passwordResetModal.style.display = "none";
});

// Fechar modal ao clicar fora
window.addEventListener("click", (e) => {
    if (e.target === passwordResetModal) {
        passwordResetModal.style.display = "none";
    }
});

// Envio do formulário de recuperação
resetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value;
    
    try {
        // Feedback visual durante o envio
        const submitBtn = resetForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        await firebase.auth().sendPasswordResetEmail(email);
        
        // Sucesso
        alert(`E-mail de recuperação enviado para ${email}\nVerifique sua caixa de entrada e spam.`);
        passwordResetModal.style.display = "none";
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        
        // Tratamento de erros específicos
        let errorMessage;
        switch(error.code) {
            case "auth/invalid-email":
                errorMessage = "E-mail inválido";
                break;
            case "auth/user-not-found":
                errorMessage = "Nenhum usuário cadastrado com este e-mail";
                break;
            default:
                errorMessage = "Erro ao enviar e-mail. Tente novamente mais tarde.";
        }
        
        resetErrorElement.textContent = errorMessage;
        resetErrorElement.style.display = "block";
    } finally {
        const submitBtn = resetForm.querySelector("button[type='submit']");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Link';
    }
});

// Função global de logout
window.logout = () => auth.signOut().then(() => window.location.href = "cadastro.html");

// Mostrar/Ocultar senha
function setupPasswordToggle(passwordId, toggleId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleButton = document.getElementById(toggleId);
    
    if (passwordInput && toggleButton) {
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alternar entre os ícones de olho aberto/fechado
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
}

// Configurar para ambos os formulários
setupPasswordToggle('regPassword', 'toggleRegPassword');
setupPasswordToggle('loginPassword', 'toggleLoginPassword');

// Inicializar verificação de estado de autenticação
document.addEventListener('DOMContentLoaded', checkAuthState);