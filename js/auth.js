function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
  .then(() => {
    alert("Conta criada!");
    window.location.href = "index.html";
  })
  .catch(error => alert(error.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
  .then(() => {
    alert("Login realizado!");
    window.location.href = "index.html";
  })
  .catch(error => alert(error.message));
}
