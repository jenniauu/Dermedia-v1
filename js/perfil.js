// Verificar autenticação e carregar dados do usuário
    document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementos da página
    const profilePicture = document.getElementById("profilePicture");
    const userName = document.getElementById("userName");
        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const accountCreated = document.getElementById("accountCreated");
        const lastLogin = document.getElementById("lastLogin");
        const btnLogout = document.getElementById("btnLogout");

        // Verificar se o usuário está autenticado
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log("Usuário logado:", user);

            // Preencher informações básicas
            profileEmail.textContent = user.email;

            // Verificar se é um usuário do Google
            // Usuário email/senha
            if (user.displayName) {
              userName.textContent = user.displayName;
              profileName.textContent = user.displayName;
            } else {
              try {
                const userDoc = await db
                  .collection("logins")
                  .doc(user.uid)
                  .get();
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  userName.textContent = userData.name || "Usuário";
                  profileName.textContent = userData.name || "Não informado";
                } else {
                  userName.textContent = "Usuário";
                  profileName.textContent = "Não informado";
                }
              } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                userName.textContent = "Usuário";
                profileName.textContent = "Não informado";
              }
            }

            // Datas de criação e último login
            if (user.metadata) {
              const createdDate = new Date(user.metadata.creationTime);
              const lastSignInDate = new Date(user.metadata.lastSignInTime);

              accountCreated.textContent = createdDate.toLocaleString("pt-BR");
              lastLogin.textContent = lastSignInDate.toLocaleString("pt-BR");
            } else {
              accountCreated.textContent = "Não disponível";
              lastLogin.textContent = "Não disponível";
            }
          } else {
            // Usuário não está logado, redirecionar para página de login
            window.location.href = "cadastro.html";
          }
        });

        // Logout
        btnLogout.addEventListener("click", function () {
          auth
            .signOut()
            .then(() => {
              window.location.href = "cadastro.html";
            })
            .catch((error) => {
              console.error("Erro ao fazer logout:", error);
            });
        });
      });
      (function () {
        function c() {
          var b = a.contentDocument || a.contentWindow.document;
          if (b) {
            var d = b.createElement("script");
            d.innerHTML =
              "window.__CF$cv$params={r:'98676ee7df2229b4',t:'MTc1OTEwNjQ2OS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
            b.getElementsByTagName("head")[0].appendChild(d);
          }
        }
        if (document.body) {
          var a = document.createElement("iframe");
          a.height = 1;
          a.width = 1;
          a.style.position = "absolute";
          a.style.top = 0;
          a.style.left = 0;
          a.style.border = "none";
          a.style.visibility = "hidden";
          document.body.appendChild(a);
          if ("loading" !== document.readyState) c();
          else if (window.addEventListener)
            document.addEventListener("DOMContentLoaded", c);
          else {
            var e = document.onreadystatechange || function () {};
            document.onreadystatechange = function (b) {
              e(b);
              "loading" !== document.readyState &&
                ((document.onreadystatechange = e), c());
            };
          }
        }
      })();
function updateProfilePicture(event) {
            const input = event.target;
            const container = document.querySelector('.profile-picture-container');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    container.style.backgroundImage = `url(${e.target.result})`;
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                container.style.backgroundImage = 'url(/imagens/default-icon.jpg)';
            }
        }
