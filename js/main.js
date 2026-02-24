const container = document.getElementById("professionals");

db.collection("professionals").where("approved", "==", true)
.onSnapshot(snapshot => {
  container.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();

    container.innerHTML += `
      <div class="card">
        <h3>${data.name}</h3>
        <p>${data.profession}</p>
        <p>${data.location}</p>
        <p class="star">⭐ ${data.rating || 0}</p>
      </div>
    `;
  });
});
