function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
  .then(() => {
    alert("Login realizado com sucesso!");
    window.location.href = "index.html";
  })
  .catch(error => alert(error.message));
}
